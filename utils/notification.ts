export const notify = (message: string, image?: string) => {
    const event = new CustomEvent('app-notification', {
        detail: {
            id: `notif_${Date.now()}`,
            message,
            image,
        },
    });
    window.dispatchEvent(event);
};
