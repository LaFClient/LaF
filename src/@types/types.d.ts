import { BrowserWindow } from "electron";
import { RPCClient } from "discord-rpc";

interface LaFPlugin {
    name: string;
    version: string;
    run: Function;
}

interface DiscordRPCController {
    Client: RPCClient;
    Stop: Function;
    Set: Function;
}

interface GameWindow {
    Window: BrowserWindow;
    GameInfo: Object;
    URL: string;
}

interface SocialWindow {
    Window: BrowserWindow;
    URL: string;
}

interface ConfigIdList {
    [name: string]: string
}