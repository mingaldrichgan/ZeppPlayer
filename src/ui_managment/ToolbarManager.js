/*
    ZeppPlayer - ZeppOS, mostly Mi Band 7, simulator for PC
    Copyright (C) 2022  MelianMiko

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import GifRecorder from "./GifRecorder.js";
import { getDeviceProfiles } from "../zepp_player/DeviceProfiles";
import AppSettingsManager from "./AppSettingsManager";

export class ToolbarManager {
    static player = null;

    // UI Elements
    static toggleMode1 = document.getElementById("mode_1");
    static toggleMode2 = document.getElementById("mode_2");
    static toggleMode4 = document.getElementById("mode_4");
    static toggleEventZones = document.getElementById("toggle_events");
    static togglePause = document.getElementById("toggle_pause");
    static toggleShift = document.getElementById("toggle_shift");

    static doReloadBtn = document.getElementById("do_reload");
    static doGifBtn = document.getElementById("do_gif");
    static doRotateBtn = document.getElementById("do_rotate");
    static doRestartBtn = document.getElementById("do_restart");

    static doBackBtn = document.getElementById("app_back");
    static doUpBtn = document.getElementById("app_up");
    static doDownBtn = document.getElementById("app_down");

    static bindSwitchBtn(config) {
        const {blockId, configId, fallback, handler} = config;

        const block = document.getElementById(blockId);
        const handleValue = (val) => {
            if(block.tagName === "INPUT") {
                block.checked = val;
            }

            val ? block.classList.add("active") : block.classList.remove("active");
        };

        const performChange = () => {
            const val = !AppSettingsManager.getObject(configId, fallback);
            AppSettingsManager.setObject(configId, val);
            handleValue(val);
            handler(val, false);
        };

        const current = AppSettingsManager.getObject(configId, fallback)
        handleValue(current);
        handler(current, true);

        block.onclick = performChange;
        return performChange;
    }

    static init(player) {
        ToolbarManager.player = player;

        ToolbarManager.actionToggleEditor = ToolbarManager.bindSwitchBtn({
            blockId: "toggle_edit",
            configId: "panelEditorVisible",
            fallback: true,
            handler: (v) => {
                document.getElementById("view_edit").style.display = v ? "" : "none";
            }
        });

        ToolbarManager.actionToggleConsole = ToolbarManager.bindSwitchBtn({
            blockId: "toggle_console",
            configId: "panelConsoleVisible",
            fallback: true,
            handler: (v) => {
                document.getElementById("view_console").style.display = v ? "" : "none";
            }
        });

        ToolbarManager.actionToggleExplorer = ToolbarManager.bindSwitchBtn({
            blockId: "toggle_explorer",
            configId: "panelExplorerVisible",
            fallback: true,
            handler: (v) => {
                document.getElementById("view_explorer").style.display = v ? "" : "none";
            }
        });

        ToolbarManager.actionToggleOverlay = ToolbarManager.bindSwitchBtn({
            blockId: "toggle_overlay",
            configId: "overlayVisible",
            fallback: true,
            handler: (v) => {
                ToolbarManager.player.config.renderDeviceOverlay = v;
            }
        })

        // Load saved settings
        if(localStorage.zepp_player_rotation !== undefined) {
            ToolbarManager.player.rotation = parseInt(localStorage.zepp_player_rotation);
        }
        ToolbarManager._refresh();

        // Bind onClick events
        ToolbarManager.toggleMode1.onclick = () => ToolbarManager.doToggleMode(1);
        ToolbarManager.toggleMode2.onclick = () => ToolbarManager.doToggleMode(2);
        ToolbarManager.toggleMode4.onclick = () => ToolbarManager.doToggleMode(4);
        ToolbarManager.toggleEventZones.onclick = ToolbarManager.doToggleEventZones;
        ToolbarManager.togglePause.onclick = ToolbarManager.doTogglePause;
        ToolbarManager.toggleShift.onclick = ToolbarManager.doToggleShift;
        ToolbarManager.doReloadBtn.onclick = ToolbarManager.doReload;
        ToolbarManager.doGifBtn.onclick = ToolbarManager.doGif;
        ToolbarManager.doRotateBtn.onclick = ToolbarManager.doRotate;
        ToolbarManager.doBackBtn.onclick = ToolbarManager.doBack;
        ToolbarManager.doUpBtn.onclick = () => ToolbarManager.doScroll(-1);
        ToolbarManager.doDownBtn.onclick = () => ToolbarManager.doScroll(1);
        ToolbarManager.doRestartBtn.onclick = () => ToolbarManager.doRestart();

        document.addEventListener("keyup", ToolbarManager.handleKeypress);
        document.addEventListener("keydown", ToolbarManager.handleControlKey)

        // Add type class
        player.onProjectChanged.add(() => {
            document.getElementById("toolbar_side").className = player.appConfig.app.appType;
        })
    }

    static initProfileSelect(player) {
        const profiles = getDeviceProfiles();
        const picker = document.getElementById("player_profile_select");

        let current = "mi_band7";
        if(localStorage.zp_profile_name && profiles[localStorage.zp_profile_name]) {
            current = localStorage.zp_profile_name;
        }

        for(const name in profiles) {
            const opt = document.createElement("option");
            opt.value = name;
            opt.innerText = name;
            picker.appendChild(opt);
        }
        picker.value = current;
        picker.onchange = async () => {
            localStorage.zp_profile_name = picker.value;
            player.profileName = picker.value;
            player.imgCache = {};
            await player.overlayTool.init();
            await player.init();
            if(player.currentRuntime) {
                player.currentRuntime.refresh_required = "profile_ch";
            }
        };

        player.profileName = current;
    }

    static handleControlKey(e) {
        if(e.ctrlKey && e.key === "p"){
            e.preventDefault();
            return false;
        }
    }

    static handleKeypress(e) {
        switch(e.key) {
            case "1":
                ToolbarManager.doToggleMode(1);
                return;
            case "2":
                ToolbarManager.doToggleMode(2);
                return;
            case "3":
                ToolbarManager.doToggleMode(4);
                return;
            case "p":
                if(e.ctrlKey) window._setReactPane("command_picker");
                return;
            case "P":
                ToolbarManager.doTogglePause();
                return;
            case "S":
                ToolbarManager.doToggleShift();
                return;
            case "Z":
                ToolbarManager.doToggleEventZones();
                return;
            case "W":
                ToolbarManager.doReload();
                return;
            case "c":
                ToolbarManager.actionToggleConsole();
                return;
            case "e":
                ToolbarManager.actionToggleEditor();
                return;
            case "+":
                ToolbarManager.switchProject(1);
                return;
            case "_":
                ToolbarManager.switchProject(-1);
                return;
            case "Escape":
                if(document.querySelector('.ui-backdrop__visible')) {
                    window._setReactPane("");
                } else {
                    ToolbarManager.doBack();
                }
                return;
        }
    }

    /**
     * Update buttons active/inactive states
     */
    static _refresh() {
        const runtime = ToolbarManager.player.currentRuntime
        const renderLevel = ToolbarManager.player.config.renderLevel;
        const data = [
            [ToolbarManager.toggleEventZones, ToolbarManager.player.config.showEventZones],
            [ToolbarManager.togglePause, runtime && runtime.uiPause],
            [ToolbarManager.toggleShift, ToolbarManager.player.config.withAutoIncrement],
            [ToolbarManager.toggleMode1, renderLevel === 1],
            [ToolbarManager.toggleMode2, renderLevel === 2],
            [ToolbarManager.toggleMode4, renderLevel === 4]
        ];

        for(let i in data) {
            const [button, enabled] = data[i];
            enabled ? button.classList.add("active") : button.classList.remove("active");
        }
    }

    static async doRestart() {
        await ToolbarManager.player.restart();
    }

    static doScroll(d) {
        ToolbarManager.player.config.renderScroll += d * 40;
    }

    static doBack() {
        ToolbarManager.player.back();
    }

    static switchProject(delta) {
        const picker = document.getElementById("project_select");
        const current = picker.value;

        let index = -1;
        for(let i = 0; i < picker.options.length; i++) {
            if(picker.options[i].value === current) {
                index = i;
                break;
            }
        }

        index += delta;
        if(!picker.options[index]) return;

        console.log("switch to", picker.options[index].value);
        picker.value = picker.options[index].value;

        // noinspection JSCheckFunctionSignatures
        picker.onchange();
    }

    static doRotate() {
        ToolbarManager.player.rotation = (ToolbarManager.player.rotation + 90) % 360;
        localStorage.zepp_player_rotation = ToolbarManager.player.rotation;
        ToolbarManager.player.currentRuntime.refresh_required = "ui";
    }

    static doToggleMode(val) {
        const player = ToolbarManager.player;
        player.setRenderLevel(val).then(() => ToolbarManager._refresh());
    }

    static doTogglePause() {
        const player = ToolbarManager.player;
        player.currentRuntime.setPause(!player.currentRuntime.uiPause);
        ToolbarManager._refresh();
    }

    static doToggleEventZones() {
        const config = ToolbarManager.player.config;
        config.showEventZones = !config.showEventZones;
        ToolbarManager._refresh();
    }

    static doToggleShift() {
        const config = ToolbarManager.player.config;
        config.withAutoIncrement = !config.withAutoIncrement;
        ToolbarManager._refresh();
    }

    static doReload() {
        const player = ToolbarManager.player;
        player.currentRuntime.persistent.wipe();
        player.init();
    }

    static async doGif() {
        const gifRecorder = new GifRecorder(ToolbarManager.player);
        await gifRecorder.record();
        gifRecorder.export();
    }
}
