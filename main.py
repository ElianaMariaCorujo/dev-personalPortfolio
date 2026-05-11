from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Portfolio Eliana")

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)

templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/eliana")
async def eliana(request: Request):
    return templates.TemplateResponse(request, "eliana.html")


@app.get("/proyectos/msn-consultorias")
async def proyecto_msn_consultorias(request: Request):
    return templates.TemplateResponse(
        request,
        "proyecto_placeholder.html",
        {"nombre_proyecto": "MSN Consultorías"},
    )


@app.get("/proyectos/que-como-hoy")
async def proyecto_que_como_hoy(request: Request):
    return templates.TemplateResponse(
        request,
        "proyecto_placeholder.html",
        {"nombre_proyecto": "¿Qué Como hoy?"},
    )


@app.get("/proyectos/cebollati")
async def proyecto_cebollati(request: Request):
    return templates.TemplateResponse(
        request,
        "proyecto_placeholder.html",
        {"nombre_proyecto": "Cebollatí"},
    )
