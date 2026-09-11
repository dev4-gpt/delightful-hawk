import json
import os
from typing import Any, Dict, Optional

class SynapticVault:
    def __init__(self, save_dir: str, conversation_id: str):
        self.save_dir = save_dir
        self.conversation_id = conversation_id
        self.vault_path = os.path.join(save_dir, f"{conversation_id}_synaptic.json")
        self._memory: Dict[str, Any] = self._load_snapshot()
        
        if "entities" not in self._memory:
            self._memory["entities"] = {}

    def _load_snapshot(self) -> Dict[str, Any]:
        if os.path.exists(self.vault_path):
            with open(self.vault_path, 'r') as f:
                return json.load(f)
        return {}

    def record_entity_baseline(self, entity_id: str, data: Dict[str, Any]) -> None:
        if entity_id not in self._memory["entities"]:
            self._memory["entities"][entity_id] = []
        self._memory["entities"][entity_id].append(data)
        self.serialize_synaptic_snapshot()

    def get_entity_history(self, entity_id: str) -> list:
        return self._memory["entities"].get(entity_id, [])

    def serialize_synaptic_snapshot(self) -> None:
        os.makedirs(os.path.dirname(self.vault_path), exist_ok=True)
        with open(self.vault_path, 'w') as f:
            json.dump(self._memory, f, indent=2)
