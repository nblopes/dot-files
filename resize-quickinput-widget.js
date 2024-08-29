/*
 * GNU GENERAL PUBLIC LICENSE
 * Version 3, 29 June 2007
 *
 * Copyright (C) [2023] [Captain Vincent]
 * Original Source: https://gist.github.com/CaptainVincent/74a15cd9d9c450e961b867f69008ee6e
 *
 * Everyone is permitted to copy and distribute verbatim copies of this license document,
 * but changing it is not allowed.
 *
 * Preamble
 *
 * The GNU General Public License is a free, copyleft license for software and other kinds of works.
 *
 * The licenses for most software and other practical works are designed to take away your freedom
 * to share and change the works. By contrast, the GNU General Public License is intended to guarantee
 * your freedom to share and change all versions of a program—to make sure it remains free software
 * for all its users.
 *
 * resize-quickinput-widget.js
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
 * Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see
 * https://www.gnu.org/licenses/.
 */

var menuExist = false;
var quickInputListNode = null;
var factor = 1;
var refresh = false;
var cachedHeight = -1;
var cachedPreOneTop = 0;
const padding = 10; // up + bottom

// Init static style

var styleElement = document.createElement("style");
var styles = `
  .quick-input-widget {
    transform: translateY(-50%) !important;
    top: 47% !important;
    box-shadow: 0 0 60px 0 rgba(0,0,0,0.2) !important;
    width: 700px !important;
    left: calc(50% - 50px) !important;
  }
  .quick-input-widget .monaco-inputbox {
    padding: 10px 10px 10px 10px !important;
    border-top-left-radius:5px!important;
    border-top-right-radius:5px!important;
    border-top: 0!important;
    border-left: 0!important;
    border-right: 0!important;
  }
  .quick-input-widget .quick-input-action {
    padding-top: 10px !important;
    font-size: 14px !important;
  }i
  .quick-input-widget .monaco-list-rows {
    font-size: 13px !important;
  }
  .quick-input-widget .monaco-list-row {
    padding: 10px !important;
    height: auto !important;
  }
  .quick-input-widget .quick-input-list-entry {
    position: relative;
    padding: 0px 0px 0px 0px;
  }
  .quick-input-widget .quick-input-list-entry .codicon[class*=codicon-] {
    font-size: 16px;
  }
  .quick-input-widget .quick-input-list .quick-input-list-entry.quick-input-list-separator-border {
    border-top-width: 0px !important;
  }
  .quick-input-widget .quick-input-list .quick-input-list-label-meta .monaco-highlighted-label:before {
    content: ' ▸ ';
  }
  .quick-input-widget .quick-input-list .quick-input-list-entry .monaco-action-bar.animated.quick-input-list-entry-action-bar {
    height: unset;
  }
  .editor-group-watermark {
    max-width: 500px !important;
    padding-left: 1em;
    padding-right: 1em;
  }
}
`;
styleElement.textContent = styles;
document.head.appendChild(styleElement);

function zoom(obj, primaryKey, cacheKey) {
    const v = parseInt(obj.style[primaryKey], 10);
    if (refresh || !obj.hasOwnProperty(cacheKey) || obj[cacheKey] != v) {
        set(obj, Math.round(v * factor), primaryKey, cacheKey);
        return true;
    }
    return v === 0;
}

function set(obj, v, primaryKey, cacheKey) {
    obj[cacheKey] = v;
    obj.style[primaryKey] = obj[cacheKey] + "px";
}

function setPaddingBottom(obj, v) {
    if (parseInt(obj.style.paddingBottom, 10) != v) {
        obj.style["paddingBottom"] = v + "px";
    }
}

function resize() {
    const monacoListRows =
        quickInputListNode.querySelector(".monaco-list-rows");
    const rows = quickInputListNode.querySelectorAll(
        ".monaco-list-rows .monaco-list-row"
    );

    refresh = false;
    if (rows && rows.length > 0) {
        var defaultHeight = parseInt(rows[0].style.height, 10);
        if (defaultHeight != cachedHeight) {
            factor = (defaultHeight + 10) / defaultHeight;
            cachedHeight = defaultHeight;
            refresh = true;
        }
        cachedPreOneTop = parseInt(rows[0].style.top, 10);
        setPaddingBottom(quickInputListNode, 5);
    } else {
        setPaddingBottom(quickInputListNode, 0);
        return;
    }

    zoom(quickInputListNode, "maxHeight", "cachedMaxHeight");
    zoom(monacoListRows, "height", "cachedHeight");
    zoom(monacoListRows, "top", "cachedTop");
    moving = false;
    rows.forEach((row) => {
        moving = zoom(row, "top", "cachedTop") || moving;
        // [[Patch]]
        // Fix a bug that some rows are not moving, so
        // I force-set their top based on the previous one.
        if (moving && parseInt(row.style.top, 10) < cachedPreOneTop) {
            set(
                row,
                cachedPreOneTop +
                Math.floor(parseInt(row.style.height, 10) * factor),
                "top",
                "cachedTop"
            );
        }
        cachedPreOneTop = parseInt(row.style.top, 10);
    });

    const scrollbar = quickInputListNode.querySelector(".scrollbar.vertical");
    if (scrollbar) {
        zoom(scrollbar, "height", "cachedHeight");
        slider = scrollbar.querySelector(".slider");
        zoom(slider, "height", "cachedHeight");
        zoom(slider, "top", "cachedTop");
    }
}

const target = document.body;
const config = { attributes: true, childList: true, subtree: true };
const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
        if (
            !menuExist &&
            mutation.type === "childList" &&
            mutation.addedNodes.length > 0
        ) {
            quickInputListNode = document.getElementById("quickInput_list");
            if (quickInputListNode) {
                menuExist = true;
                resize();
                const maxHeightObserver = new MutationObserver(
                    mutationsList => resize()
                );
                maxHeightObserver.observe(quickInputListNode, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ["style"],
                });
            }
        }
    }
});

observer.observe(target, config);