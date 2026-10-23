import psutil
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/processes", tags=["Processes"])

class ProcessOut(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_mb: float
    status: str
    username: str | None = None

SORT_KEYS = {
    "memory": lambda p: -p.memory_mb,
    "cpu": lambda p: -p.cpu_percent,
    "name": lambda p: p.name.lower(),
    "pid": lambda p: p.pid,
}

@router.get("", response_model=list[ProcessOut])
def list_processes(
    sort: str = Query("memory", pattern="^(memory|cpu|name|pid)$"),
    limit: int = Query(50, ge=1, le=500),
):
    procs = []
    attrs = ["pid", "name", "cpu_percent", "memory_info", "status", "username"]
    for p in psutil.process_iter(attrs):
        try:
            i = p.info
            mem = i["memory_info"]
            procs.append(ProcessOut(
                pid=i["pid"],
                name=i["name"] or "?",
                cpu_percent=i["cpu_percent"] or 0.0,
                memory_mb=round(mem.rss / 1024 / 1024, 1) if mem else 0.0,
                status=i["status"] or "unknown",
                username=i["username"],
            ))
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    procs.sort(key=SORT_KEYS[sort])
    return procs[:limit]