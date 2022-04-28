import { BrowserWindow } from 'electron';
import { RPCClient } from 'discord-rpc';

interface LaFPlugin {
    name: string;
    version: string;
    run: Function;
}

interface DataStore {
    [name: string]: string;
}

interface GameActivity {
    class: {
        name: string,
        index: string
    };
    custom: boolean;
    id: string;
    map: string;
    mode: string;
    time: number;
    user: string;
}

interface ClientWindow extends Window {
    AppControl: Function;
    OffCliV: boolean;
    WindowType: string;
    ToggleStatus: Function;
    ShowMessage: Function;
    HQJoin: Function;
    getGameActivity: () => GameActivity;
}

interface AltAccounts {
    [index: string]: string;
}
