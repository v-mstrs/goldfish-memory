import browser from "webextension-polyfill";

/**
 * Displays a compact, dark-themed modal above the selected text to add a new character.
 */
export function showAddCharacterModal(name: string, novelId: number, selectionRect?: DOMRect) {
    const existing = document.getElementById('goldfish-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'goldfish-modal-overlay';
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: transparent; z-index: 2147483647;`;
    overlay.onclick = (e) => e.target === overlay && overlay.remove();

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: absolute; background: #242424; color: #fff; padding: 10px; border-radius: 6px;
        width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; flex-direction: column;
        gap: 8px; font-family: Calibri, sans-serif; font-size: 13px; border: 1px solid #3f3f3f;
    `;

    const title = document.createElement('div');
    title.textContent = name;
    title.style.cssText = `font-weight: 600; font-size: 14px; margin-bottom: 2px;`;
    modal.appendChild(title);

    const createInput = (placeholder: string, isTextarea = false, isOptional = false) => {
        const input = isTextarea ? document.createElement('textarea') : document.createElement('input');
        if (isTextarea) (input as HTMLTextAreaElement).rows = 2;
        input.placeholder = placeholder;
        input.style.cssText = `
            background: #2d2d2d; border: 1px ${isOptional ? 'dashed #aaa' : 'solid #3f3f3f'};
            border-radius: 4px; color: ${isOptional ? '#aaa' : '#fff'}; padding: 6px;
            width: 100%; box-sizing: border-box; font-family: inherit; font-size: 13px; outline: none;
        `;
        input.onfocus = () => input.style.borderColor = '#007acc';
        input.onblur = () => input.style.borderColor = isOptional ? '#aaa' : '#3f3f3f';
        return input;
    };

    const descInput = createInput('Description...', true) as HTMLTextAreaElement;
    const aliasInput = createInput('Aliases (comma sep)', false, true);
    const imgInput = createInput('Image URL', false, true);

    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = `display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;`;

    const createBtn = (text: string, isPrimary: boolean, onClick: () => void) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            cursor: pointer; border-radius: 4px; border: none; padding: 6px 12px;
            font-size: 12px; font-weight: 500; color: #fff; transition: background 0.2s;
            background: ${isPrimary ? '#007acc' : '#3f3f3f'};
        `;
        btn.onmouseover = () => btn.style.background = isPrimary ? '#008be5' : '#4f4f4f';
        btn.onmouseout = () => btn.style.background = isPrimary ? '#007acc' : '#3f3f3f';
        btn.onclick = onClick;
        return btn;
    };

    btnGroup.appendChild(createBtn('Cancel', false, () => overlay.remove()));
    btnGroup.appendChild(createBtn('Save', true, async () => {
        const description = descInput.value.trim();
        if (!description && !imgInput.value.trim() && !aliasInput.value.trim()) {
            descInput.style.borderColor = 'red';
            return;
        }
        try {
            await browser.runtime.sendMessage({
                type: 'ADD_CHARACTER',
                novelId, name, description,
                aliases: aliasInput.value.split(',').map(s => s.trim()).filter(Boolean),
                imageUrl: imgInput.value.trim()
            });
            overlay.remove();
        } catch (e) { alert('Failed to save.'); }
    }));

    [descInput, aliasInput, imgInput, btnGroup].forEach(el => modal.appendChild(el));
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (selectionRect && selectionRect.width > 0) {
        modal.style.visibility = 'hidden';
        requestAnimationFrame(() => {
            let top = selectionRect.top - modal.offsetHeight - 10;
            if (top < 10) top = selectionRect.bottom + 10;
            let left = Math.max(10, Math.min(selectionRect.left, document.documentElement.clientWidth - modal.offsetWidth - 10));
            modal.style.top = `${top}px`;
            modal.style.left = `${left}px`;
            modal.style.visibility = 'visible';
            descInput.focus();
        });
    } else {
        modal.style.cssText += `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
    }
}