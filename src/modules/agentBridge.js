export function initAgentBridge(viewer) {
    const container = document.createElement('div');
    container.id = 'agent-tactical-drawer';
    container.style.position = 'absolute';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.width = '350px';
    container.style.background = 'rgba(15, 20, 30, 0.8)';
    container.style.backdropFilter = 'blur(10px)';
    container.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    container.style.borderRadius = '8px';
    container.style.color = '#fff';
    container.style.fontFamily = 'monospace';
    container.style.zIndex = '1000';
    container.style.padding = '15px';
    container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
    container.style.transition = 'all 0.3s ease';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    header.style.paddingBottom = '5px';

    const title = document.createElement('strong');
    title.innerText = 'Antigravity Coordinator';
    title.style.color = '#00ffcc';

    const toggle = document.createElement('button');
    toggle.innerText = '[-]';
    toggle.style.background = 'none';
    toggle.style.border = 'none';
    toggle.style.color = '#fff';
    toggle.style.cursor = 'pointer';

    header.appendChild(title);
    header.appendChild(toggle);
    container.appendChild(header);

    const content = document.createElement('div');
    content.id = 'agent-bridge-content';
    content.style.maxHeight = '200px';
    content.style.overflowY = 'auto';
    
    const messages = [
        '[SYSTEM] Initializing Agent Bridge...',
        '[PULSE] Agent Coordinator: Analyzing AIS contact 987654321...',
        '[DOMAIN: MARITIME] Delegated to SentinelMesh: Loiter time 90m detected',
        '[ALERT] Threat Matrix: CRITICAL'
    ];

    messages.forEach(msg => {
        const line = document.createElement('div');
        line.innerText = msg;
        line.style.margin = '4px 0';
        line.style.fontSize = '12px';
        if (msg.includes('CRITICAL') || msg.includes('ALERT')) {
            line.style.color = '#ff4444';
        } else if (msg.includes('DOMAIN')) {
            line.style.color = '#ffbb33';
        } else {
            line.style.color = '#aaa';
        }
        content.appendChild(line);
    });

    container.appendChild(content);

    let expanded = true;
    toggle.addEventListener('click', () => {
        expanded = !expanded;
        if (expanded) {
            content.style.display = 'block';
            toggle.innerText = '[-]';
            container.style.width = '350px';
        } else {
            content.style.display = 'none';
            toggle.innerText = '[+]';
            container.style.width = '200px'; // Optionally collapse width too
        }
    });

    document.body.appendChild(container);
}
