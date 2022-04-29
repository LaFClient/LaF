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

interface GameWindow extends Window {
    OffCliV: boolean;
    getGameActivity: () => GameActivity;
    logoutAcc: () => void;
    loginAcc: () => void;
    saveAcc: (force?: boolean) => void;
}

interface AltAccounts {
    [index: string]: string;
}
