/**
 * ページが読み込まれた後に実行される初期化関数。
 * タイプとオーダーの初期化を行い、保存された設定値を復元し、フォームの送信イベントを設定します。
 */
document.addEventListener("DOMContentLoaded", function ()
{
    InitType();
    InitOrder();
    loadSettings();  // 設定値を復元

    let form = document.querySelector("form");

    /**
     * フォームの送信イベントリスナー。
     * フォームの送信を防止し、設定を取得してバックグラウンドスクリプトにメッセージを送信し、設定値を保存します。
     * 
     * @param {Event} event - フォームの送信イベント。
     */
    form.addEventListener("submit", function (event)
    {
        event.preventDefault();
        const setting = {
            order: document.getElementById("Order").value,
            type: document.getElementById("Type").value,
            customize: document.getElementById("Customize").value
        };

        saveSettings(setting);  // 設定値を保存

        if (typeof browser === "undefined")
        {
            var browser = chrome;
        }

        browser.runtime.sendMessage({ type: "sortTabs", setting: setting }, function (response)
        {
            if (response.success)
            {
                console.log("Tabs sorted successfully.");
            } else
            {
                console.error("Error sorting tabs:", response.error);
            }
        });
    });
});

/**
 * タイプ選択肢の初期化を行う関数。
 * ドロップダウンに「URL」および「Title」のオプションを設定します。
 */
function InitType()
{
    let type = document.getElementById("Type");
    let typeSelect = { OrderByURL: "URL", OrderByTitle: "Title" };
    Object.keys(typeSelect).forEach(function (key)
    {
        let opt = document.createElement('option');
        opt.setAttribute('value', typeSelect[key]);
        opt.innerText = key;
        type.appendChild(opt);
    });
    type.selectedIndex = 0;
}

/**
 * オーダー選択肢の初期化を行う関数。
 * ドロップダウンに「Asc」および「Desc」のオプションを設定します。
 */
function InitOrder()
{
    let order = document.getElementById("Order");
    let orderSelect = { AscOrder: "Asc", DescOrder: "Desc" };
    Object.keys(orderSelect).forEach(function (key)
    {
        let opt = document.createElement('option');
        opt.setAttribute('value', orderSelect[key]);
        opt.innerText = key;
        order.appendChild(opt);
    });
    order.selectedIndex = 0;
}

/**
 * 設定値を`chrome.storage.local`に保存する関数。
 * 
 * @param {Object} setting - 保存する設定値。order, type, customizeの各プロパティを含む。
 */
function saveSettings(setting)
{
    chrome.storage.local.set({
        order: setting.order,
        type: setting.type,
        customize: setting.customize
    });
}

/**
 * `chrome.storage.local`から保存された設定値を取得し、フォームに反映する関数。
 */
function loadSettings()
{
    chrome.storage.local.get(['order', 'type', 'customize'], function (result)
    {
        if (result.order)
        {
            document.getElementById("Order").value = result.order;
        }
        if (result.type)
        {
            document.getElementById("Type").value = result.type;
        }
        if (result.customize)
        {
            document.getElementById("Customize").value = result.customize;
        }
    });
}
