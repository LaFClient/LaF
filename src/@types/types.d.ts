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

interface ClientWindow extends Window {
    AppControl: Function;
    OffCliV: boolean;
    WindowType: string;
    ToggleStatus: Function;
    ShowMessage: Function;
    HQJoin: Function;
}
