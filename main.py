from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="HIV Dynamics Simulator")

# Allow browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# DATA MODEL
# -------------------------------
class SimulationParams(BaseModel):
    t_max: int = 200
    therapy_start: int = 30
    release_rate: float = 0.1
    payload_type: str = "siRNA"

# -------------------------------
# CORE MODEL (Simplified ODE)
# -------------------------------
def simulate_hiv(params: SimulationParams):
    t = np.arange(0, params.t_max)

    T = np.zeros_like(t, dtype=float)  # Healthy T cells
    V = np.zeros_like(t, dtype=float)  # Viral load
    L = np.zeros_like(t, dtype=float)  # Latent reservoir

    # Initial conditions
    T[0] = 1000
    V[0] = 50
    L[0] = 300

    for i in range(1, len(t)):
        therapy = 1 if i >= params.therapy_start else 0

        kill_factor = therapy * params.release_rate

        T[i] = T[i - 1] + 2 - 0.01 * V[i - 1]
        V[i] = V[i - 1] + 0.5 * V[i - 1] - kill_factor * V[i - 1]
        L[i] = L[i - 1] - kill_factor * L[i - 1] * 0.5

        # Floor values
        T[i] = max(T[i], 0)
        V[i] = max(V[i], 0)
        L[i] = max(L[i], 0)

    return {
        "time": t.tolist(),
        "T": T.tolist(),
        "V": V.tolist(),
        "L": L.tolist(),
    }

# -------------------------------
# API ENDPOINT
# -------------------------------
@app.post("/simulate")
def run_simulation(params: SimulationParams):
    return simulate_hiv(params)
