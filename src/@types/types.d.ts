import { BrowserWindow } from "electron";
import { RPCClient } from "discord-rpc";

interface LaFPlugin {
    name: string;
    version: string;
    run: Function;
}

interface DataStore {
    [name: string]: string
}