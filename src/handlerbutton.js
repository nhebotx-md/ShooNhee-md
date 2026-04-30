// ========================================
// BUTTON HANDLER CORE (FULL VERSION)
// ========================================

/**
 * Base sender (internal)
 */
async function send(sock, jid, payload) {
    return await sock.sendMessage(jid, payload)
}

// ========================================
// #1 BUTTON REPLY TYPES
// ========================================

export const replyButton = {

    list: async (sock, jid, { name, description, rowId }) =>
        send(sock, jid, {
            buttonReply: { name, description, rowId },
            type: 'list'
        }),

    plain: async (sock, jid, { displayText, id }) =>
        send(sock, jid, {
            buttonReply: { displayText, id },
            type: 'plain'
        }),

    template: async (sock, jid, { displayText, id, index = 1 }) =>
        send(sock, jid, {
            buttonReply: { displayText, id, index },
            type: 'template'
        }),

    interactive: async (sock, jid, { body, id, description, version = 1 }) =>
        send(sock, jid, {
            buttonReply: {
                body,
                nativeFlows: {
                    name: 'menu_options',
                    paramsJson: JSON.stringify({ id, description }),
                    version
                }
            },
            type: 'interactive'
        })
}

// ========================================
// #2 BUTTON MESSAGE (MULTI BUTTON)
// ========================================

export async function sendButtons(sock, jid, {
    text,
    footer,
    caption,
    image,
    buttons = []
}) {
    return send(sock, jid, {
        text,
        footer,
        caption,
        image,
        buttons
    })
}

// ========================================
// #3 LIST MESSAGE
// ========================================

export async function sendList(sock, jid, {
    text,
    footer,
    title,
    buttonText,
    sections
}) {
    return send(sock, jid, {
        text,
        footer,
        title,
        buttonText,
        sections
    })
}

// ========================================
// #4 PRODUCT LIST
// ========================================

export async function sendProductList(sock, jid, {
    text,
    footer,
    title,
    buttonText,
    productList,
    businessOwnerJid,
    thumbnail
}) {
    return send(sock, jid, {
        text,
        footer,
        title,
        buttonText,
        productList,
        businessOwnerJid,
        thumbnail
    })
}

// ========================================
// #5 CARDS
// ========================================

export async function sendCards(sock, jid, {
    text,
    title,
    subtitle,
    footer,
    cards
}) {
    return send(sock, jid, {
        text,
        title,
        subtitle,
        footer,
        cards
    })
}

// ========================================
// #7 INTERACTIVE (FULL POWER)
// ========================================

export async function sendInteractive(sock, jid, {
    text = '',
    title,
    subtitle,
    footer,
    media = {},
    interactiveButtons = [],
    hasMediaAttachment = false
}) {
    return send(sock, jid, {
        ...media,
        text,
        title,
        subtitle,
        footer,
        interactiveButtons,
        hasMediaAttachment
    })
}

// ========================================
// INTERACTIVE BUTTON BUILDERS
// ========================================

export const interactiveBuilder = {

    quickReply: (display_text, id) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text, id })
    }),

    url: (display_text, url) => ({
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({ display_text, url })
    }),

    call: (display_text, phone_number) => ({
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({ display_text, phone_number })
    }),

    copy: (display_text, copy_code) => ({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({ display_text, copy_code })
    }),

    location: (display_text) => ({
        name: 'send_location',
        buttonParamsJson: JSON.stringify({ display_text })
    }),

    catalog: (business_phone_number) => ({
        name: 'cta_catalog',
        buttonParamsJson: JSON.stringify({ business_phone_number })
    }),

    webview: (title, url, in_app = true) => ({
        name: 'open_webview',
        buttonParamsJson: JSON.stringify({
            title,
            link: {
                in_app_webview: in_app,
                url
            }
        })
    }),

    singleSelect: (title, sections) => ({
        name: 'single_select',
        buttonParamsJson: JSON.stringify({ title, sections })
    }),

    paymentPIX: (data) => ({
        name: 'payment_info',
        buttonParamsJson: JSON.stringify(data)
    }),

    paymentPay: (data) => ({
        name: 'review_and_pay',
        buttonParamsJson: JSON.stringify(data)
    })
}