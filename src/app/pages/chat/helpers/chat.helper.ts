export const scrollToBottomMessages = (): void => {
    setTimeout(() => {
        const messagesArea = document.querySelector('.messages-area') as HTMLElement | null;
        if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }, 100);
};
