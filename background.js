/**
 * 指定された設定に基づいてタブをソートする非同期関数。
 * 
 * @param {Object} setting - タブのソート設定。`order`（昇順・降順）、`type`（URLまたはTitle）、`customize`（カスタムソート用の優先文字列）を含む。
 */
async function SortTabs(setting)
{
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const pinnedTabs = tabs.filter(tab => tab.pinned);

    // 各タブのソート対象文字列を設定
    tabs.forEach((tab, index) =>
    {
        let sortString = "";
        if (setting.type == "URL")
        {
            const url = new URL(tab.url);
            sortString = url.href.slice(url.protocol.length);
        } else if (setting.type == "Title")
        {
            sortString = tab.title;
        }
        tab.sortString = sortString;
        tab.index = index;
    });

    const priorityStrings = setting.customize ? setting.customize.split("\n") : [];

    // タブのソート処理
    tabs.sort((a, b) =>
    {
        let aPriorityIndex = -1;
        let bPriorityIndex = -1;

        // カスタムソート用の優先文字列に基づいて優先度を設定
        if (priorityStrings.length > 0)
        {
            for (const str of priorityStrings)
            {
                if (str && a.sortString.includes(str))
                {
                    aPriorityIndex = priorityStrings.indexOf(str);
                }
                if (str && b.sortString.includes(str))
                {
                    bPriorityIndex = priorityStrings.indexOf(str);
                }
            }
        }

        // 優先度に基づいてソート
        if (aPriorityIndex !== -1 || bPriorityIndex !== -1)
        {
            if (aPriorityIndex === -1) return setting.order === "Asc" ? 1 : -1;
            if (bPriorityIndex === -1) return setting.order === "Asc" ? -1 : 1;
            return setting.order === "Asc" ? aPriorityIndex - bPriorityIndex : bPriorityIndex - aPriorityIndex;
        }

        // 通常のソート処理
        if (a.sortString < b.sortString) return setting.order === "Asc" ? -1 : 1;
        if (a.sortString > b.sortString) return setting.order === "Asc" ? 1 : -1;
        return a.index - b.index;
    });

    // 現在のピン留めタブのピンを解除
    const currentPinnedTabs = await chrome.tabs.query({ currentWindow: true, pinned: true });
    for (let tab of currentPinnedTabs)
    {
        await chrome.tabs.update(tab.id, { pinned: false });
    }

    // タブを新しい順序に従って移動
    for (const [index, tab] of tabs.entries())
    {
        await chrome.tabs.move(tab.id, { index: index });
    }

    // もとのピン留めタブを再度ピン留め
    for (let i = 0; i < pinnedTabs.length; i++)
    {
        const pinnedTab = pinnedTabs[i];
        await chrome.tabs.update(pinnedTab.id, { pinned: true });
    }
}

/**
 * メッセージリスナー。`sortTabs`メッセージを受信した場合、指定された設定に基づいてタブのソートを実行します。
 * 
 * @param {Object} message - 受信したメッセージ。`type`および`setting`を含む。
 * @param {Object} sender - メッセージ送信者に関する情報。
 * @param {Function} sendResponse - メッセージに対するレスポンスを送信するためのコールバック関数。
 * @returns {boolean} - 非同期処理が行われることを示すために`true`を返します。
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
{
    if (message.type === "sortTabs")
    {
        SortTabs(message.setting).then(() =>
        {
            sendResponse({ success: true });
        }).catch(err =>
        {
            sendResponse({ success: false, error: err.message });
        });
        return true;  // 非同期でレスポンスを送信するためにtrueを返す
    }
});
