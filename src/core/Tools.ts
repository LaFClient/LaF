export const UrlType = (url: string) => {
    if (url.startsWith('https://krunker.io/social.html')) return 'hub';
    if (url.startsWith('https://krunker.io/editor.html')) return 'editor';
    if (url.startsWith('https://krunker.io/viewer.html')) return 'viewer';
    if (
        url.startsWith('https://krunker.io') ||
        url.startsWith('https://comp.krunker.io/?game=') ||
        url.startsWith('https://127.0.0.1:8080')
    )
        return 'game';
    return 'external';
};
