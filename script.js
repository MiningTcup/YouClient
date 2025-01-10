let apiKey = "";
let order = "relevance";
let duration = "any";
let nextPageToken = "";
let previousPageToken = "";
const apiUrl = "https://www.googleapis.com/youtube/v3/";
const players = [];
let openNew = false;
String.prototype.splitStart = function (delimiter) {
    return this.startsWith(delimiter)
        ? [delimiter, this.slice(delimiter.length)]
        : ["", this];
};
function preventDefault(e) {
    e.preventDefault();
}
function getFormatted(num) {
    if (num < 1000) {
        return num.toString();
    } else if (num < 1000000) {
        return (num / 1000).toFixed(1) + "K";
    } else if (num < 1000000000) {
        return (num / 1000000).toFixed(1) + "M";
    } else if (num < 1000000000000) {
        return (num / 1000000000).toFixed(1) + "B";
    } else {
        return (num / 1000000000000).toFixed(1) + "T";
    }
}
function getFormattedDate(iso) {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
        year: seconds / 31536000,
        month: seconds / 2592000,
        week: seconds / 604800,
        day: seconds / 86400,
        hour: seconds / 3600,
        minute: seconds / 60,
    };

    for (let interval in intervals) {
        const count = Math.floor(intervals[interval]);
        if (count > 1) {
            return `${count} ${interval}s ago`;
        }
        if (count === 1) {
            return `1 ${interval} ago`;
        }
    }

    return "Just now";
}
function getFormattedLinks(text, shorten = false) {
    const urlRegex =
        /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    return text.replace(urlRegex, function (url) {
        if (shorten) {
            const shortened =
                url.length > shorten + 3
                    ? `${url.substring(0, shorten)}...`
                    : url;
            return `<a href="${url}" target="_blank">${shortened}</a>`;
        } else {
            return `<a href="${url}" target="_blank">${url}</a>`;
        }
    });
}
function getJSON(text) {
    return JSON.stringify(text, null, 4);
}
function getElem(id, doc = document) {
    return doc.getElementById(id);
}
function deleteKey(key) {
    localStorage.removeItem(key);
}
function getKey(key) {
    return localStorage.getItem(key);
}
function setKey(key, value) {
    return localStorage.setItem(key, value);
}
function verifyKey(key, value) {
    const oldValue = getKey(key);
    if (oldValue === undefined || oldValue === null) setKey(key, value);
    return oldValue;
}
function clearDocument(doc = document, bodyID) {
    const bodyElems = doc.getElementsByClassName(bodyID);
    if (bodyID) {
        if (bodyElems) {
            for (elem of bodyElems) {
                elem.innerHTML = "";
            }
        } else return null;
    } else doc.body.innerHTML = "";
}
function setHTML(data, doc = document, replace = true) {
    if (replace) clearDocument();
    if (data instanceof Element) doc.body.append(data);
    else doc.body.innerHTML += data;
}
function setFavicon(url) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = url;
}
function disguise(load = true) {
    let disguiseFrame = getElem("disguise");
    if (!disguiseFrame) {
        const iframe = document.createElement("iframe");
        iframe.src = getKey("disguiseURL");
        iframe.frameBorder = 0;
        iframe.id = "disguise";
        setHTML(iframe, undefined, false);
    } else if (load) {
        if (disguiseFrame.style.display == "block") {
            disguiseFrame.style.display = "none";
            getElem("return-tab").remove();
        } else {
            disguiseFrame.style.display = "block";
            disguiseFrame.style.height = document.body.scrollHeight;
            const returnTab = document.createElement("div");
            returnTab.id = "return-tab";
            returnTab.addEventListener("click", function () {
                disguise();
            });
            setHTML(returnTab, undefined, false);
        }
    }
}
function setSettings(key, value) {
    if (key != undefined && value != undefined) setKey(key, value);
    verifyKey("preventUnload", "false");
    verifyKey("order", "relevance");
    verifyKey("duration", "any");
    verifyKey("openNew", "true");
    verifyKey("darkMode", "true");
    verifyKey("apiKey", "");
    verifyKey("disguiseKey", "");
    verifyKey("disguiseURL", "");
    verifyKey("tabTitle", "YouClient");
    verifyKey(
        "tabFavicon",
        "data:image/vnd.microsoft.icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAREREREREAARERERERERARERERERERERERERAREREREREREAEREREREREQAAERERERERAAAREREREREAEREREREREQERERERERERERERERARERERERERAAERERERERAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAMADAACAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAAwAMAAP//AAD//wAA"
    );
    if (getKey("preventUnload") == "true")
        window.addEventListener("beforeunload", preventDefault);
    else window.removeEventListener("beforeunload", preventDefault);
    openNew = getKey("openNew");
    apiKey = getKey("apiKey");
    order = getKey("order");
    duration = getKey("duration");
    try {
        document.querySelectorAll(".order-popup-choice").forEach((item) => {
            item.classList.remove("order-popup-chosen");
        });
        getElem(`order-${getKey("order")}`).classList.add("order-popup-chosen");
        getElem(`duration-${getKey("duration")}`).classList.add(
            "order-popup-chosen"
        );
    } catch (e) {
        console.log(e);
    }
    if (getKey("darkMode") == "true") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
    }
    else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
    }
    document.title = getKey("tabTitle");
    setFavicon(getKey("tabFavicon"));
    disguise(false);
}
function getQueryUrl(
    part,
    type,
    regionCode,
    order,
    maxResults,
    q,
    extraArgs = ""
) {
    return `${apiUrl}search?part=snippet&type=video&regionCode=US&order=${order}&maxResults=${maxResults}&q=${encodeURIComponent(
        q
    )}&key=${apiKey}${extraArgs}`;
}
function getVideoUrl(part, id) {
    return `${apiUrl}videos?part=${part}&id=${id}&key=${apiKey}`;
}

function showOrder() {
    const popup = getElem("order-popup-container");
    popup.style.display = "flex";
    getElem("order-popup-close-container").focus();
}
function closeOrder() {
    const popup = getElem("order-popup-container");
    popup.style.display = "none";
}

async function showSettings() {
    clearDocument(undefined, "content");
    setSettings();
    const content = document.createElement("div");
    content.classList.add("content");
    function createSetting(
        name,
        key,
        type = "text",
        placeholder = "",
        desc = "",
        other = ""
    ) {
        switch (type) {
            case "text":
            case "password":
                content.innerHTML += `
                <div class="option-container">
                    <div class="option-name">${name}</div>
                    <div class="input-container">
                        <input type="${type}" onchange="setSettings('${key}', this.value)" placeholder="${placeholder}" onclick="this.select()" value="${getKey(
                    key
                )}"${other}>
                    </div>
                </div>
            `;
                break;
            case "checkbox":
                content.innerHTML += `
                <div class="option-container">
                    <label class="switch">
                        <input type="${type}" onchange="setSettings('${key}', this.checked)"${
                    getKey(key) === "true" ? " checked" : ""
                }${other}>
                        <span class="slider"></span>
                    </label>
                    <div>
                        <div class="option-name">${name}</div>
                        <div class="option-desc grey">${desc}</div>
                    </div>
                </div>
            `;
                break;
        }
    }
    content.innerHTML += `
<div class="bold" id="settings-banner">
    YouClient<br>Settings
    <div style="margin-left: auto; width: 180px; height: 180px; fill: currentcolor;"><svg fill="none" fill-rule="evenodd" viewBox="0 0 155 155" xmlns="http://www.w3.org/2000/svg" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;">
      <g transform="translate(50 17.7)">
        <mask fill="#fff">
          <path d="M.4.3h98.7v110.4H.4z"></path>
        </mask>
        <path d="M29.8 1.3C42.9-.2 62.4.1 73.5 1.3c15.1 1.7 23 6.7 24 22 1 15.4 1.6 37.4 1.6 45.4s-3.3 14.7-11 17c-7.6 2.3-9.3 6.7-10.3 12.7-1 6-4.7 12-18.7 12.3C45.1 111 .4 103 .4 103s4.3-52.6 4.7-69.7c.3-20.9 2.7-29.5 24.7-32" fill="#EEE" mask="url(#account_advanced__b)"></path>
      </g>
      <g transform="translate(6 88.7)">
        <mask fill="#fff">
          <path d="M.8.8h114.1V50H.8z"></path>
        </mask>
        <path d="M8.5 50c-6-.5-10.7-5.7-5.5-14.5C8 26.7 17.3 13.5 41 10.3c23.9-3.1 23.6 3.8 35.5 3.3C87.4 13 87.4 5 87.8 3.6c.5-1.6 1.6-3 4.8-2.7 3.2.4 17.2 2.3 19 3 1.7.6 3.4 1.4 3.3 5.2-.1 3.7-3.2 40.9-48 40.9H8.5z" fill="#00D4B5" mask="url(#account_advanced__d)"></path>
      </g>
      <path d="M101 70.3c-1 .3-6.2 4.3-6 10.7.4 6.4 4.2 11.2 12.2 11.9 8 .7 14.4-.8 17.5-5.8 3.1-5 1.5-10.3.7-11.1-.8-1-7.8-2.2-8.8-2.2-1 .1-1.3.8-1.2 2.2 0 1.3.8 9-5.8 7.6-6.5-1.4-3.4-7.2-1.1-9.4 1.4-1.4 0-2.8-1.4-3.1-1.4-.4-4.3-1.4-6.1-.8" fill="#4620AE"></path>
      <g transform="translate(6 47.7)">
        <mask fill="#fff">
          <path d="M0 .7h69.5v52.1H0z"></path>
        </mask>
        <path d="M10.2 10.9c7.7-1.7 40.3-9 45.4-10 4.8-.8 10.4.2 11.8 5 0 0-3.4 8-3.3 8.3.7 4.5 5.3 8.2 5.3 8.2v3.4c0 5.2-2 21.1-27.5 25.8-20.8 3.8-35.7-.8-40.6-19-3.8-14 1.2-20 9-21.7" fill="#00D4B5" mask="url(#account_advanced__f)"></path>
      </g>
      <path d="M33.9 54.7c0-5.8-.3-11.3 2.6-11.3 2.8 0 6.3 9.3 6.3 9.3l-9 2zM19.6 74c1 5.4 3.6 7.4 12 5.9 7-1.3 35.2-8 43.8-9.8a143.9 143.9 0 0 0-2-16.5C66.6 55.1 31.7 63 27.8 64c-7.3 1.7-9.3 4.6-8.2 10" fill="#4620AE"></path>
      <path d="M30.4 38.3c.5-2.6 2.8-4 5.2-3.5 2.7.5 4.2 2.7 3.7 5.2-.6 2.5-2.6 4-5.3 3.6-2.6-.4-4.1-2.6-3.6-5.3" fill="#FF76DA"></path>
      <path d="M47.4 84.9c.5-2.7 2.8-4 5.3-3.5 2.7.5 4.2 2.7 3.6 5.2-.5 2.4-2.5 4-5.2 3.6-2.6-.4-4.2-2.6-3.7-5.3" fill="#4620AE"></path>
      <path d="M119.6 50.8c3.2-3.3 7.8-2.9 10.8.1 0 0 1.2 6.2-2 9-3 3-8.9 1.8-8.9 1.8-3.2-3.1-3.2-7.7 0-11" fill="#FF76DA"></path>
      <path d="M119.5 61.7c3.4 3.1 7.8 3 11 0 3-2.9 3.2-7.5-.1-10.8l-10.9 10.8z" fill="#4620AE"></path>
      <path d="M119.4 41c-3.2-3.2-2.8-7.8.2-10.8 0 0 5-.1 8 3s2.7 7.9 2.7 7.9c-3 3.2-7.6 3.2-10.9 0" fill="red"></path>
      <path d="M130.3 41c3.2-3.3 3-7.6 0-10.8-2.8-3.1-7.4-3.2-10.7 0l10.7 10.9z" fill="#FF76DA"></path>
      <path d="M72.4 35.6c0-4.6 3.5-7.6 7.7-7.6 0 0 5 3.4 4.8 7.7-.1 4.3-4.8 7.6-4.8 7.6-4.5.1-7.7-3.1-7.7-7.7" fill="red"></path>
      <path d="M80 43.3a7.6 7.6 0 0 0 7.8-7.7c.1-4.2-3-7.5-7.7-7.6v15.3zM101.3 29.1L95 37.9c-1.3 1.8 0 3.3 1.7 3.3h10.5c1.7 0 2.7-1.9 1.7-3.3l-6-8.8a1 1 0 0 0-1.6 0" fill="#4620AE"></path>
      <path d="M106.3 62.4h-9a2.5 2.5 0 0 1-2.5-2.6V53c0-1.9 1.6-2.9 3-2.9h9c1.4 0 2.5 1.1 2.5 2.5v7.2c0 1.5-1.2 2.6-3 2.6" fill="red"></path>
      <path d="M120.9 97.8c.1-3.8-1.6-4.6-3.4-5.3-1.7-.6-15.7-2.5-19-3-3.1-.3-4.2 1.2-4.7 2.8-.4 1.5-.4 9.5-11.2 10-3 .1-5.1-.2-7.1-.7v37a43 43 0 0 0 45.4-40.8" fill="#00D4B5"></path>
      <path d="M28.8 73.7a1.5 1.5 0 0 1-.3-3l40.2-8.9c.8-.2 1.6.4 1.8 1.2.2.8-.3 1.6-1.2 1.8l-40.2 8.8h-.3" fill="#FF76DA"></path>
      <path d="M62.8 119.7h-25a1.3 1.3 0 0 1 0-2.5h25a1.3 1.3 0 0 1 0 2.5M58.5 113.6H42a1.3 1.3 0 0 1 0-2.5h16.4a1.3 1.3 0 0 1 0 2.5M58.5 125.8H42a1.3 1.3 0 0 1 0-2.5h16.4a1.3 1.3 0 0 1 0 2.5M75.5 135.7a.8.8 0 0 1-.8-.8v-28a.8.8 0 0 1 1.5 0v28c0 .5-.3.8-.7.8M79.4 135.7a.8.8 0 0 1-.8-.8v-28a.8.8 0 0 1 1.5 0v28c0 .5-.3.8-.7.8M25 135.7a.8.8 0 0 1-.8-.8v-22.6a.8.8 0 0 1 1.5 0V135c0 .5-.3.8-.7.8M21.2 135.7a.8.8 0 0 1-.7-.8v-19.6a.8.8 0 0 1 1.5 0v19.6c0 .5-.4.8-.8.8" fill="#4620AE"></path>
    </svg></div>
    </div>
`;
    createSetting(
        "Prevent Unload",
        "preventUnload",
        "checkbox",
        "",
        "Prevent YouClient from being closed without your consent."
    );
    createSetting(
        "Play in New Tab",
        "openNew",
        "checkbox",
        "",
        "Open the video player in a new about:blank tab."
    );
    createSetting(
        "Dark Mode",
        "darkMode",
        "checkbox",
        "",
        "Use a dark theme."
    );
    createSetting("Tab Title", "tabTitle", "text", "YouClient");
    createSetting("Tab Favicon", "tabFavicon", "text", "https://");
    createSetting("API Key", "apiKey", "password");
    createSetting(
        "Disguise Key",
        "disguiseKey",
        "text",
        "",
        "",
        ` maxlength="1"`
    );
    createSetting("Disguise URL", "disguiseURL", "text", "https://");
    setHTML(content, undefined, false);
}
async function loadChannelData(id) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?id=${id}&key=${apiKey}&part=snippet,statistics`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.items.length === 0) {
            console.error("Channel not found");
            return null;
        } else return data.items[0];
    } catch (error) {
        console.error("Error fetching channel info:", error.message);
        return null;
    }
}
async function loadVideoData(id) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&part=snippet,statistics`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.items[0];
}
function setHeight(elem) {
    elem.style.height = "";
    elem.style.height = elem.scrollHeight;
}
async function loadVideo(id, video, data, channel) {
    if (!video) video = await loadVideoData(id);
    if (!video) {
        console.log("Invalid Video");
        return;
    } else if (!id) id = video.id.videoId;
    let player;
    if (openNew == "true") {
        players.push(open());
        player = players[players.length - 1];
        player.document.head.append(getElem("style").cloneNode(true));
        player.document.head.append(getElem("favicon").cloneNode(true));
        player.document.title = document.title;
        player.document.documentElement.className = document.documentElement.className;
        if (getKey("preventUnload") == "true")
            player.addEventListener("beforeunload", preventDefault);
    } else {
        clearDocument(undefined, "content");
        player = window;
    }
    const iframeAPI = document.createElement("script");
    iframeAPI.id = "iframeAPI";
    iframeAPI.src = "https://www.youtube.com/iframe_api";
    player.document.head.append(iframeAPI);
    const content = document.createElement("div");
    content.classList.add("content");
    if (openNew == "true") {
        content.innerHTML += `
        <div id="player"></div>
            <div id="player-container">
            <div id="player-title">${video.snippet.title}</div>
            <div id="player-channel-container">
                <img src="${
                    channel.snippet.thumbnails.default.url
                }" id="player-channel-image"></img>
                <div id="player-channel-info-container"></div>
                <div>
                    <div id="player-channel-title">${
                        video.snippet.channelTitle
                    }</div>
                    <div id="player-channel-subscribers">${getFormatted(
                        channel.statistics.subscriberCount
                    )} subscribers</div>
                </div>
            </div>
            <div id="player-description"><div id="player-description-info">${getFormatted(
                data.statistics.viewCount
            )} views ${getFormattedDate(
            data.snippet.publishedAt
        )} <div id="player-description-tags">${(
            data.snippet.description.match(/#\w+/g) || []
        ).join(" ")}</div></div>${
            getFormattedLinks(data.snippet.description, 45) ||
            "No description available."
        }</div>
        </div>
    `;
    } else {
        content.innerHTML += `
        <div id="player-container">
            <div class="round-12" id="player"></div>
            <div id="player-title">${video.snippet.title}</div>
            <div id="player-channel-container">
                <img src="${
                    channel.snippet.thumbnails.default.url
                }" id="player-channel-image"></img>
                <div id="player-channel-info-container"></div>
                <div>
                    <div id="player-channel-title">${
                        video.snippet.channelTitle
                    }</div>
                    <div id="player-channel-subscribers">${getFormatted(
                        channel.statistics.subscriberCount
                    )} subscribers</div>
                </div>
            </div>
            <div id="player-description"><div id="player-description-info">${getFormatted(
                data.statistics.viewCount
            )} views ${getFormattedDate(
            data.snippet.publishedAt
        )} <div id="player-description-tags">${(
            data.snippet.description.match(/#\w+/g) || []
        ).join(" ")}</div></div>${
            getFormattedLinks(data.snippet.description, 45) ||
            "No description available."
        }</div>
        </div>
    `;
    }
    setHTML(content, player.document, false);
    try {
        player.eval(`
                new YT.Player("player", {
                    height: "1080",
                    width: "1920",
                    videoId: "${id}"
                });
            `);
    } catch {
        iframeAPI.onload = function () {
            getElem("www-widgetapi-script", player.document).onload =
                function () {
                    player.eval(`
                new YT.Player("player", {
                    height: "1080",
                    width: "1920",
                    videoId: "${id}"
                });
            `);
                };
        };
    }
}
function loadChannel(name) {}
async function showResults(query, items) {
    clearDocument(undefined, "content");
    setSettings();
    getElem("search-bar").value = query;
    if (items.length < 1) {
        console.log(`No items matched ${query}`);
        return;
    }
    const content = document.createElement("div");
    content.classList.add("content");
    const results = document.createElement("div");
    const nav = document.createElement("div");
    nav.id = "result-page-container";
    nav.innerHTML = `
        <div class="increment-page" onclick="loadResults('${query}', '${previousPageToken}')" id="previous-page"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg></div>
        <div class="increment-page" onclick="loadResults('${query}', '${nextPageToken}')" id="next-page"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></div>`;
    results.id = "results-container";
    content.append(nav);
    content.insertBefore(results, content.firstChild);
    setHTML(content, undefined, false);
    items.forEach(async (item) => {
        const elem = document.createElement("div");
        elem.classList.add("result-container");
        elem.innerHTML = `
            <div class="thumbnail-container">
                <img src="${item.snippet.thumbnails.high.url}" alt="${item.snippet.title}" class="thumbnail">
            </div>
            <div class="thumbnail-info-container">
                <div class="thumbnail-title">${item.snippet.title}</div>
                <div class="thumbnail-info">Loading views</div>
                <div class="thumbnail-channel-container">
                    <img src="" class="thumbnail-channel-image"></img>
                    <div class="thumbnail-info">${item.snippet.channelTitle}</div>
                </div>
                <div class="thumbnail-info">${item.snippet.description}</div>
                <div class="thumbnail-info thumbnail-id">${item.id.videoId}</div>
            </div>`;
        results.append(elem);
        const videoInfo = await loadVideoData(item.id.videoId);
        const channelInfo = await loadChannelData(videoInfo.snippet.channelId);
        elem.querySelector(".thumbnail-info").textContent =
            getFormatted(videoInfo.statistics.viewCount) +
            " views · " +
            getTimeAgo(videoInfo.snippet.publishedAt);
        const channelImageElem = elem.querySelector(".thumbnail-channel-image");
        channelImageElem.src = channelInfo.snippet.thumbnails.default.url;
        elem.addEventListener("click", () =>
            loadVideo(item.id.videoId, item, videoInfo, channelInfo)
        );
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!previousPageToken)
        getElem("previous-page").classList.add("unavailible");
    if (!nextPageToken) getElem("next-page").classList.add("unavailible");
}
function loadResults(query, token) {
    fetch(
        getQueryUrl(
            "snippet",
            "video",
            "US",
            order,
            "50",
            query,
            `&videoDuration=${duration}${token ? `&pageToken=${token}` : ""}`
        )
    )
        .then((response) => response.json())
        .then((data) => {
            nextPageToken = data.nextPageToken;
            previousPageToken = data.prevPageToken;
            showResults(query, data.items);
        })
        .catch((e) => console.error(`Error searching for ${query}: ${e}`));
}
async function search(query) {
    getElem("suggestion-box").style.display = "none";
    getElem("search-bar").value = query;
    const sel = query.split(":");
    const sel0 = sel[0];
    const sel1 = sel.slice(1);
    switch (sel0) {
        case "id":
            const id = sel1;
            const video = await loadVideoData(id);
            const data = video;
            const channel = await loadChannelData(data.snippet.channelId);
            loadVideo(sel1, video, data, channel);
            break;
        default:
            loadResults(sel);
    }
}
// Does not require API credits
function getSearchSuggestions(text, limit) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const callbackName = `suggestCallBack_${Date.now()}`;

        window[callbackName] = (data) => {
            const suggestions = data[1]
                .map((item) => ({ value: item[0] }))
                .slice(0, limit);
            resolve(suggestions);
            delete window[callbackName];
            script.remove();
        };

        script.src = `http://suggestqueries.google.com/complete/search?hl=en&ds=yt&jsonp=${callbackName}&q=${text}&client=youtube`;
        document.body.appendChild(script);
    });
}
function setSuggestionsPosition() {
    const searchBarPos = getElem("search-bar").getBoundingClientRect();
    const suggestionBox = getElem("suggestion-box");
    suggestionBox.style.top = `${searchBarPos.top + searchBarPos.height + 4}px`;
    suggestionBox.style.left = `${searchBarPos.left}px`;
    suggestionBox.style.width = getElem("search-bar").clientWidth + "px";
}
async function showHead() {
    setHTML(
        `
        <svg xmlns="http://www.w3.org/2000/svg" style="display: none">
            <symbol id="icon-tune" viewBox="0 -960 960 960" width="24px">
                <path
                    d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"
                    fill="var(--icon-fill)"
                ></path>
            </symbol>
            <symbol id="icon-search" viewBox="0 0 24 24">
                <path
                    clip-rule="evenodd"
                    d="M16.296 16.996a8 8 0 11.707-.708l3.909 3.91-.707.707-3.909-3.909zM18 11a7 7 0 00-14 0 7 7 0 1014 0z"
                    fill-rule="evenodd"
                    fill="var(--icon-fill)"
                ></path>
            </symbol>
            <symbol id="icon-settings" viewBox="0 0 24 24">
                <path
                    clip-rule="evenodd"
                    d="m14.302 6.457-.668-.278L12.87 3.5h-1.737l-.766 2.68-.668.277c-.482.2-.934.463-1.344.778l-.575.44-2.706-.677-.868 1.504 1.938 2.003-.093.716c-.033.255-.05.514-.05.779 0 .264.017.524.05.779l.093.716-1.938 2.003.868 1.504 2.706-.677.575.44c.41.315.862.577 1.344.778l.668.278.766 2.679h1.737l.765-2.68.668-.277c.483-.2.934-.463 1.345-.778l.574-.44 2.706.677.869-1.504-1.938-2.003.092-.716c.033-.255.05-.514.05-.779 0-.264-.017-.524-.05-.779l-.092-.716 1.938-2.003-.869-1.504-2.706.677-.574-.44c-.41-.315-.862-.577-1.345-.778Zm4.436.214Zm-3.86-1.6-.67-2.346c-.123-.429-.516-.725-.962-.725h-2.492c-.446 0-.838.296-.961.725l-.67 2.347c-.605.251-1.17.58-1.682.972l-2.37-.593c-.433-.108-.885.084-1.108.47L2.717 8.08c-.223.386-.163.874.147 1.195l1.698 1.755c-.04.318-.062.642-.062.971 0 .329.021.653.062.97l-1.698 1.756c-.31.32-.37.809-.147 1.195l1.246 2.158c.223.386.675.578 1.109.47l2.369-.593c.512.393 1.077.72 1.681.972l.67 2.347c.124.429.516.725.962.725h2.492c.446 0 .839-.296.961-.725l.67-2.347c.605-.251 1.17-.58 1.682-.972l2.37.593c.433.108.885-.084 1.109-.47l1.245-2.158c.223-.386.163-.874-.147-1.195l-1.698-1.755c.04-.318.062-.642.062-.971 0-.329-.021-.653-.062-.97l1.698-1.756c.31-.32.37-.809.147-1.195L20.038 5.92c-.224-.386-.676-.578-1.11-.47l-2.369.593c-.512-.393-1.077-.72-1.681-.972ZM15.5 12c0 1.933-1.567 3.5-3.5 3.5S8.5 13.933 8.5 12s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5ZM14 12c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2Z"
                    fill="var(--icon-fill)"
                    fill-rule="evenodd"
                ></path>
            </symbol>
            <symbol id="icon-close" viewBox="0 0 24 24">
                <path
                    clip-rule="evenodd"
                    d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"
                    fill="var(--icon-fill)"
                    fill-rule="evenodd"
                ></path>
            </symbol>
        </svg>
        <div id="head-bar">
            <span id="settings" onclick="showSettings()">
                <svg class="icon" width="24" height="24">
                    <use href="#icon-settings"></use>
                </svg>
            </span>
            <div id="search-container">
                <div id="suggestion-box"></div>
                <input type="text" id="search-bar" autocomplete="off" placeholder="Search" autofocus>
                <button id="search-button">
                    <span id="search-icon">
                        <svg class="icon" width="24" height="24">
                            <use href="#icon-search"></use>
                        </svg>
                    </span>
                </button>
            </div>
            <span id="order" onclick="showOrder()">
                <svg class="icon" width="24" height="24">
                    <use href="#icon-tune"></use>
                </svg>
            </span>
        </div>
        <div class="popup-center-container" id="order-popup-container">
            <div id="order-popup" class="round-12">
                <div class="flex">
                    <div id="order-popup-title">Search filters</div>
                    <div id="order-popup-close-container" onclick="closeOrder()">
                        <svg class="icon" width="24" height="24">
                            <use href="#icon-close"></use>
                        </svg>
                    </div>
                </div>
                <div id="order-popup-options-container">
                    <div class="order-popup-option">
                        <h4 class="order-popup-option-header">SORT BY</h4>
                        <div class="order-popup-choice" id="order-relevance" onclick="setSettings('order', 'relevance')" title="Sort by relevance">Relevance</div>
                        <div class="order-popup-choice" id="order-date" onclick="setSettings('order', 'date')" title="Sort by upload date">Upload date</div>
                        <div class="order-popup-choice" id="order-viewCount" onclick="setSettings('order', 'viewCount')" title="Sort by view count">View count</div>
                        <div class="order-popup-choice" id="order-rating" onclick="setSettings('order', 'rating')" title="Sort by rating">Rating</div>
                        <div class="order-popup-choice" id="order-title" onclick="setSettings('order', 'title')" title="Sort by title">Title</div>
                    </div>



                    <div class="order-popup-option">
                        <h4 class="order-popup-option-header">DURATION</h4>
                        <div class="order-popup-choice" id="duration-any" onclick="setSettings('duration', 'any')" title="Search for any duration">Any duration</div>
                        <div class="order-popup-choice" id="duration-short" onclick="setSettings('duration', 'short')" title="Search for under 4 minutes">Under 4 minutes</div>
                        <div class="order-popup-choice" id="duration-medium" onclick="setSettings('duration', 'medium')" title="Search for 4 - 20 minutes">4 - 20 minutes</div>
                        <div class="order-popup-choice" id="duration-long" onclick="setSettings('duration', 'long')" title="Search for over 20 minutes">Over 20 minutes</div>
                    </div>
                </div>
            </div>
        </div>`,
        undefined,
        false
    );
    const searchBar = getElem("search-bar");
    const suggestionBox = getElem("suggestion-box");
    searchBar.onkeydown = suggestionBox.onkeydown = function (e) {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                const children = Array.from(suggestionBox.children);
                const focusedElement = document.activeElement;
                const currentIndex = children.indexOf(focusedElement);
                let nextIndex = currentIndex + 1;
                if (nextIndex >= children.length) {
                    nextIndex = 0;
                }
                children[nextIndex].focus();
                break;
            case "ArrowUp":
                e.preventDefault();
                const childrenUp = Array.from(suggestionBox.children);
                const focusedElementUp = document.activeElement;
                const currentIndexUp = childrenUp.indexOf(focusedElementUp);
                let prevIndex = currentIndexUp - 1;
                if (prevIndex < 0) {
                    prevIndex = childrenUp.length - 1;
                }
                childrenUp[prevIndex].focus();
                break;
            case "Enter":
                if (event.target == searchBar) search(searchBar.value);
                else event.target.click();
                break;
        }
    };
    searchBar.addEventListener("focus", function () {
        if (suggestionBox.innerHTML.length > 0)
            suggestionBox.style.display = "block";
    });
    document.addEventListener("click", function (e) {
        if (
            !searchBar.contains(e.target) &&
            !suggestionBox.contains(e.target)
        ) {
            suggestionBox.style.display = "none";
        }
    });
    searchBar.addEventListener("input", function (e) {
        setSuggestionsPosition();
        getSearchSuggestions(searchBar.value, 14)
            .then((suggestions) => {
                suggestionBox.innerHTML = suggestions
                    .map(
                        (item) =>
                            `
                            <div tabindex="0" class="suggestion-item" onclick="search('${
                                item.value
                            }')">
                                <div class="flex align-items-center">
                                    <span class="search-icon">
                                        <svg class="icon" width="20" height="20">
                                            <use href="#icon-search"></use>
                                        </svg>
                                    </span>${item.value
                                        .splitStart(searchBar.value)[0]
                                        .replaceAll(" ", "&nbsp;")}
                                    <div class="bold-600">${item.value
                                        .splitStart(searchBar.value)[1]
                                        .replaceAll(" ", "&nbsp;")}</div>
                                </div>
                            </div>
                            `
                    )
                    .join("");
                if (suggestions.length === 0) {
                    suggestionBox.style.display = "none";
                } else suggestionBox.style.display = "block";
            })
            .catch((error) => {
                console.error("Error fetching suggestions:", error);
            });
    });
    getElem("search-button").addEventListener("click", function (e) {
        search(searchBar.value);
    });
}
document.addEventListener("keydown", function (e) {
    if (e.key == getKey("disguiseKey")) disguise();
});
window.addEventListener("resize", setSuggestionsPosition);
clearDocument(undefined);
showHead();
setSettings();
if (getKey("apiKey").length < 1) showSettings();