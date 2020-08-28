function HyphaePreInitStyles() {
    if (HyphaePreInitStyles.INSTANCE) {
        return HyphaePreInitStyles.INSTANCE;
    }
    const stylesheetEl = document.createElement('style');
    document.head.appendChild(stylesheetEl);

    const add = (selector, style) => {
        stylesheetEl.sheet.insertRule(`
        ${selector} { 
            ${style}
        }
    `);
    };

    const reset = () => {
        document.head.removeChild(stylesheetEl);
    };

    HyphaePreInitStyles.INSTANCE = {
        add,
        reset
    };
    return HyphaePreInitStyles.INSTANCE;
}