import customtkinter as ctk
import hid
import threading
import time
import re
import datetime
import os
import sys
from collections import deque
from PIL import Image, ImageTk

# --- CARGA SEGURA DE LIBRERÍAS GRÁFICAS ---
HAVE_GRAPH = False
try:
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    import mplcursors 
    HAVE_GRAPH = True
except Exception as e:
    print(f"Error cargando gráficas: {e}")
    HAVE_GRAPH = False

# --- CONFIGURACIÓN ---
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

# IDs (WCH - UT61E+)
VENDOR_ID = 0x1A86
PRODUCT_ID = 0xE429

# Colores
TRANSPARENT_COLOR = "#000001"
COLOR_CIAN = "#00ffff"
COLOR_FONDO = "#1a1a1a"
COLOR_GRID = "#333333"

# Windows API
from ctypes import windll
GWL_EXSTYLE = -20
WS_EX_APPWINDOW = 0x00040000
WS_EX_TOOLWINDOW = 0x00000080

# --- VENTANA OSCILOSCOPIO ---
class OsciloscopioWindow(ctk.CTkToplevel):
    def __init__(self, master_app):
        super().__init__()
        self.title("MARSHALL CELL - Analyzer")
        self.geometry("700x500")
        self.master_app = master_app
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.pausado = False
        
        # Toolbar
        self.toolbar = ctk.CTkFrame(self, height=40, fg_color="#222")
        self.toolbar.pack(fill="x", side="top")
        
        self.btn_pause = ctk.CTkButton(self.toolbar, text="⏸ PAUSAR", width=80, height=25, fg_color="#aa5500", command=self.toggle_pause)
        self.btn_pause.pack(side="left", padx=10, pady=5)
        
        self.btn_save = ctk.CTkButton(self.toolbar, text="📷 FOTO", width=80, height=25, fg_color="#0055aa", command=self.guardar_foto)
        self.btn_save.pack(side="left", padx=10, pady=5)
        
        self.lbl_info = ctk.CTkLabel(self.toolbar, text="Pasa el mouse para ver valores", text_color="gray", font=("Arial", 10))
        self.lbl_info.pack(side="right", padx=10)

        # Gráfica
        if HAVE_GRAPH:
            plt.style.use('dark_background')
            self.fig, self.ax = plt.subplots(figsize=(5, 4), dpi=100)
            self.fig.patch.set_facecolor(COLOR_FONDO)
            self.ax.set_facecolor(COLOR_FONDO)
            
            self.max_puntos = 150
            self.datos_y = deque([0]*self.max_puntos, maxlen=self.max_puntos)
            self.datos_x = list(range(self.max_puntos))
            
            self.linea, = self.ax.plot(self.datos_x, self.datos_y, color=COLOR_CIAN, linewidth=2)
            
            self.ax.grid(True, color=COLOR_GRID, linestyle='--', linewidth=0.5)
            self.ax.set_title("ANÁLISIS DE CONSUMO", color="white", fontsize=10, pad=10)
            self.ax.spines['top'].set_visible(False)
            self.ax.spines['right'].set_visible(False)
            self.ax.spines['bottom'].set_color('#555')
            self.ax.spines['left'].set_color('#555')
            
            self.canvas = FigureCanvasTkAgg(self.fig, master=self)
            self.canvas.draw()
            self.canvas.get_tk_widget().pack(fill="both", expand=True)
            
            # CONFIGURACIÓN DEL CURSOR (HOVER)
            try:
                self.cursor = mplcursors.cursor(self.linea, hover=True)
                self.cursor.connect("add", self.al_pasar_mouse)
            except: pass
        else:
            lbl_err = ctk.CTkLabel(self, text="Error: Librería Matplotlib no funciona.", text_color="red")
            lbl_err.pack(expand=True)

    def al_pasar_mouse(self, sel):
        # --- DISEÑO MEJORADO DE LA ETIQUETA ---
        val = sel.target[1]
        
        # Texto: Muestra el valor con 4 decimales
        sel.annotation.set_text(f"{val:.4f}")
        
        # Color del texto (Cian brillante para que resalte)
        sel.annotation.set_color(COLOR_CIAN)
        sel.annotation.set_fontweight("bold")
        
        # Caja de fondo (Negro sólido con borde Cian)
        sel.annotation.get_bbox_patch().set(
            fc="#000000",       # Fondo negro puro
            ec=COLOR_CIAN,      # Borde cian
            alpha=1.0,          # Totalmente opaco (sin transparencia)
            boxstyle="round,pad=0.5"
        )
        
        # Flecha indicadora
        sel.annotation.arrow_patch.set(arrowstyle="-|>", fc=COLOR_CIAN, ec=COLOR_CIAN)

    def toggle_pause(self):
        self.pausado = not self.pausado
        if self.pausado:
            self.btn_pause.configure(text="▶ REANUDAR", fg_color="#00aa00")
            self.lbl_info.configure(text="PAUSADO - Mueve el mouse sobre la línea")
        else:
            self.btn_pause.configure(text="⏸ PAUSAR", fg_color="#aa5500")
            self.lbl_info.configure(text="Midiendo...")

    def obtener_ruta_script(self):
        # Esta función determina dónde está el archivo .py o el .exe
        if getattr(sys, 'frozen', False):
            # Si es un ejecutable (creado con PyInstaller)
            return os.path.dirname(sys.executable)
        else:
            # Si es un script de Python normal
            return os.path.dirname(os.path.abspath(__file__))

    def guardar_foto(self):
        if not HAVE_GRAPH: return
        
        # Usamos la ruta del script para crear la carpeta
        base_path = self.obtener_ruta_script()
        capturas_path = os.path.join(base_path, "Capturas")
        
        if not os.path.exists(capturas_path):
            os.makedirs(capturas_path)
            
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(capturas_path, f"Oscilograma_{timestamp}.png")
        
        self.fig.savefig(filename, facecolor=self.fig.get_facecolor())
        
        # Mostrar mensaje corto
        self.lbl_info.configure(text="¡Guardado en carpeta Capturas!")
        self.after(3000, lambda: self.lbl_info.configure(text="Listo"))

    def agregar_dato(self, valor):
        if self.pausado or not HAVE_GRAPH: return
        try:
            val_float = float(valor)
        except: val_float = 0.0
            
        self.datos_y.append(val_float)
        self.linea.set_ydata(self.datos_y)
        self.ax.relim()
        self.ax.autoscale_view(True, True, True)
        self.canvas.draw_idle()

    def on_close(self):
        self.master_app.ventana_grafica = None
        self.destroy()

# --- APP PRINCIPAL ---
class MultimetroApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("MARSHALL CELL - Precision Logger V23")
        self.geometry("500x350")
        self.resizable(False, False)
        self.wm_attributes("-transparentcolor", TRANSPARENT_COLOR)
        
        self.running = True
        self.is_overlay = False
        self.max_val = -999999.0
        self.min_val = 999999.0
        self.ventana_grafica = None

        try:
            self.icon_diodo = ctk.CTkImage(light_image=Image.open("dicon.png"), dark_image=Image.open("dicon.png"), size=(40, 40))
            img_vacia = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
            self.icon_vacio = ctk.CTkImage(light_image=img_vacia, dark_image=img_vacia, size=(1, 1))
        except:
            self.icon_diodo = None
            self.icon_vacio = None

        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True)

        self.header_frame = ctk.CTkFrame(self.main_container, fg_color="transparent", height=40)
        self.header_frame.pack(pady=(5, 0), fill="x") 
        self.lbl_titulo = ctk.CTkLabel(self.header_frame, text="MARSHALL CELL", font=("Roboto", 18, "bold"), text_color="gray")
        self.lbl_titulo.pack(side="left", padx=(15, 5)) 
        self.lbl_status = ctk.CTkLabel(self.header_frame, text="●", font=("Arial", 18), text_color="red")
        self.lbl_status.pack(side="left") 
        self.switch_overlay = ctk.CTkSwitch(self.header_frame, text="HUD", command=self.toggle_overlay, font=("Roboto", 12), onvalue=True, offvalue=False, width=40, height=20)
        self.switch_overlay.pack(side="right", padx=15)

        self.filtro_var = ctk.StringVar(value="AUTO")
        self.selector_filtro = ctk.CTkSegmentedButton(self.main_container, values=["AUTO", "VOLT", "OHM", "DIOD", "uA", "A"], variable=self.filtro_var, font=("Roboto", 11, "bold"), height=25)
        self.selector_filtro.pack(pady=(5, 5), padx=30, fill="x")

        self.display_frame = ctk.CTkFrame(self.main_container, fg_color="#1a1a1a", corner_radius=15, border_width=2, border_color="#333333")
        self.display_frame.pack(pady=5, padx=10, fill="both", expand=True)
        self.display_frame.bind("<ButtonPress-1>", self.start_move)
        self.display_frame.bind("<ButtonRelease-1>", self.stop_move)
        self.display_frame.bind("<B1-Motion>", self.do_move)

        self.lbl_valor = ctk.CTkLabel(self.display_frame, text="----", font=("Consolas", 110, "bold"), text_color="#00ffff")
        self.lbl_valor.place(relx=0.5, rely=0.45, anchor="center")
        self.lbl_valor.bind("<ButtonPress-1>", self.start_move)
        self.lbl_valor.bind("<ButtonRelease-1>", self.stop_move)
        self.lbl_valor.bind("<B1-Motion>", self.do_move)
        
        self.lbl_unidad = ctk.CTkLabel(self.display_frame, text="---", font=("Roboto", 24), text_color="gray")
        self.lbl_unidad.place(relx=0.85, rely=0.80, anchor="center")

        self.switch_overlay_mini = ctk.CTkSwitch(self.display_frame, text="", command=self.toggle_overlay, width=30, height=20, bg_color="transparent", onvalue=True, offvalue=False)

        self.stats_frame = ctk.CTkFrame(self.main_container, height=40, fg_color="transparent")
        self.stats_frame.pack(fill="x", side="bottom", pady=5)
        self.lbl_min = ctk.CTkLabel(self.stats_frame, text="MIN: ----", font=("Roboto", 14), text_color="#ff5555")
        self.lbl_min.pack(side="left", padx=20)
        self.lbl_max = ctk.CTkLabel(self.stats_frame, text="MAX: ----", font=("Roboto", 14), text_color="#55ff55")
        self.lbl_max.pack(side="right", padx=20)
        
        btn_text = "GRAPH" if HAVE_GRAPH else "ERR LIB"
        btn_col = "#00aa00" if HAVE_GRAPH else "#aa0000"
        self.btn_graph = ctk.CTkButton(self.stats_frame, text=btn_text, width=50, height=20, font=("Arial", 10, "bold"), fg_color=btn_col, command=self.abrir_grafica)
        self.btn_graph.place(relx=0.45, rely=0.5, anchor="center")
        
        self.btn_reset = ctk.CTkButton(self.stats_frame, text="RST", width=40, height=20, font=("Arial", 10), fg_color="#444", command=self.reset_stats)
        self.btn_reset.place(relx=0.55, rely=0.5, anchor="center")

        self.thread = threading.Thread(target=self.leer_usb)
        self.thread.daemon = True
        self.thread.start()

    def abrir_grafica(self):
        if self.ventana_grafica is None or not self.ventana_grafica.winfo_exists():
            self.ventana_grafica = OsciloscopioWindow(self)
        else:
            self.ventana_grafica.focus()

    def start_move(self, event):
        self.x = event.x
        self.y = event.y

    def stop_move(self, event):
        self.x = None
        self.y = None

    def do_move(self, event):
        if self.is_overlay:
            x = self.winfo_x() + (event.x - self.x)
            y = self.winfo_y() + (event.y - self.y)
            self.geometry(f"+{x}+{y}")

    def set_app_window(self):
        hwnd = windll.user32.GetParent(self.winfo_id())
        style = windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        style = style & ~WS_EX_TOOLWINDOW
        style = style | WS_EX_APPWINDOW
        windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)
        self.withdraw()
        self.after(10, self.deiconify)

    def toggle_overlay(self):
        self.is_overlay = not self.is_overlay
        if self.is_overlay:
            self.switch_overlay.select()
            self.switch_overlay_mini.select()
            self.overrideredirect(True)
            self.wm_attributes("-topmost", True)
            self.header_frame.pack_forget()
            self.selector_filtro.pack_forget()
            self.stats_frame.pack_forget()
            self.configure(fg_color=TRANSPARENT_COLOR)
            self.main_container.configure(fg_color=TRANSPARENT_COLOR)
            self.display_frame.configure(fg_color=TRANSPARENT_COLOR, corner_radius=0, border_width=0)
            self.lbl_valor.configure(text_color="#00ffff") 
            self.lbl_unidad.configure(text_color="#00ffff")
            self.lbl_valor.place(relx=0.5, rely=0.38, anchor="center")
            self.lbl_unidad.place(relx=0.5, rely=0.62, anchor="center")
            self.switch_overlay_mini.place(relx=0.05, rely=0.1)
            self.after(10, self.set_app_window)
        else:
            self.switch_overlay.deselect()
            self.switch_overlay_mini.deselect()
            self.overrideredirect(False)
            self.wm_attributes("-topmost", False)
            self.withdraw()
            self.after(10, self.deiconify)
            self.configure(fg_color=("gray90", "gray13"))
            self.main_container.configure(fg_color="transparent")
            self.display_frame.configure(fg_color="#1a1a1a", corner_radius=15, border_width=2)
            self.lbl_valor.configure(text_color="#00ffff")
            self.lbl_unidad.configure(text_color="gray")
            self.lbl_valor.place(relx=0.5, rely=0.45, anchor="center")
            self.lbl_unidad.place(relx=0.85, rely=0.80, anchor="center")
            self.switch_overlay_mini.place_forget()
            self.header_frame.pack(pady=(5, 0), fill="x", before=self.display_frame)
            self.selector_filtro.pack(pady=(5, 5), padx=30, fill="x", before=self.display_frame)
            self.stats_frame.pack(fill="x", side="bottom", pady=5)

    def reset_stats(self):
        self.max_val = -999999.0
        self.min_val = 999999.0
        self.lbl_min.configure(text="MIN: ----")
        self.lbl_max.configure(text="MAX: ----")

    def formatear_fijo(self, texto):
        if "OL" in texto.upper(): return "OL"
        try:
            if "." in texto:
                entero, decimal = texto.split(".")
                decimal = (decimal + "000")[:3]
                return f"{entero}.{decimal}"
            return f"{texto}.000"
        except: return texto

    def actualizar_gui(self, valor_raw, unidad):
        try:
            texto_mostrar = self.formatear_fijo(valor_raw)
            self.lbl_valor.configure(text=texto_mostrar)
            
            if not self.is_overlay: self.lbl_status.configure(text_color="#00ff00")

            if unidad == "Diod" and self.icon_diodo:
                self.lbl_unidad.configure(text="", image=self.icon_diodo)
            elif self.icon_vacio and unidad not in ["A", "mA"]:
                self.lbl_unidad.configure(text=unidad, image=self.icon_vacio)
            else:
                self.lbl_unidad.configure(text=unidad, image=None)

            if "OL" not in texto_mostrar:
                try:
                    f = float(texto_mostrar)
                    if f > self.max_val:
                        self.max_val = f
                        self.lbl_max.configure(text=f"MAX: {self.max_val:.3f}")
                    if f < self.min_val:
                        self.min_val = f
                        self.lbl_min.configure(text=f"MIN: {self.min_val:.3f}")
                    
                    if self.ventana_grafica and self.ventana_grafica.winfo_exists():
                        self.ventana_grafica.agregar_dato(f)
                except: pass
        except: pass

    def leer_usb(self):
        try:
            devs = hid.enumerate(VENDOR_ID, PRODUCT_ID)
            target_path = None
            for d in devs:
                if d['usage_page'] == 0xffa0: target_path = d['path']; break
            if not target_path and devs: target_path = devs[-1]['path']
            
            if not target_path:
                self.lbl_valor.configure(text="NO USB")
                return

            h = hid.device()
            h.open_path(target_path)
            h.set_nonblocking(1)
            
            while self.running:
                datos = h.read(64)
                if datos:
                    val, uni = self.procesar_datos_v22(datos)
                    if val: self.after(0, self.actualizar_gui, val, uni)
                time.sleep(0.05)
        except: self.lbl_valor.configure(text="ERROR")

    def procesar_datos_v22(self, dat):
        try:
            txt = "".join([chr(b) for b in dat if 32 <= b <= 126])
            
            if "OL" in txt.upper() or "?0" in txt:
                val_str = "OL"
            else:
                m = re.search(r"([-+]?\d+\.\d+)", txt)
                if m:
                    val_str = m.group(1)
                else:
                    return None, None
            
            modo = self.filtro_var.get()
            unidad = "---"
            
            if modo == "DIOD": return val_str, "Diod"
            elif modo == "OHM" or ("Ohm" in txt or "kOhm" in txt): return val_str, "Ω"
            elif modo == "VOLT" or "V" in txt: return val_str, "V"
            elif modo == "A" or modo == "uA": return val_str, modo
            elif modo == "AUTO":
                 if "V" not in txt and "Ohm" not in txt: unidad = "A"
                 elif "V" in txt: unidad = "V"
                 elif "Ohm" in txt: unidad = "Ω"

            return val_str, unidad

        except: return None, None

    def on_closing(self):
        self.running = False
        if self.ventana_grafica: self.ventana_grafica.destroy()
        self.destroy()

if __name__ == "__main__":
    app = MultimetroApp()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()