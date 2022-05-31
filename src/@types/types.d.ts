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
        name: string;
        index: string;
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
    WindowType: string;
    ToggleStatus: Function;
    ShowMessage: Function;
    HQJoin: Function;
    AddAccount: () => void;
    EditAccount: () => void;
    DeleteAccount: () => void;
    LoginAccount: () => void;
    LogoutAccount: () => void;
}

interface SettingsWindow extends Window {
    AppControl: Function;
    setConfig: Function;
    getConfig: Function;
}

interface GameWindow extends Window {
    OffCliV: boolean;
    getGameActivity: () => GameActivity;
    logoutAcc: () => void;
    loginAcc: () => void;
    saveAcc: (force?: boolean) => void;
    windows: any[];
    gameLoaded: boolean
}

interface AltAccounts {
    [index: string]: string;
}

interface ClientSettings {
    [index: string]:
        {
            category: string;
        }
        |{
            type: 'checkbox' | 'select' | 'input' | 'slider' | 't_account';
            default?: string | boolean | null;
            options?: {
                [index: string]: string | boolean;
            };
            restart: boolean;
        };
}
