export declare enum XWAPaths {
    xwa2_newsletter_create = "xwa2_newsletter_create",
    xwa2_newsletter_subscribers = "xwa2_newsletter_subscribers",
    xwa2_newsletter_view = "xwa2_newsletter_view",
    xwa2_newsletter_metadata = "xwa2_newsletter",
    xwa2_newsletter_admin_count = "xwa2_newsletter_admin",
    xwa2_newsletter_follow = "xwa2_newsletter_follow",
    xwa2_newsletter_unfollow = "xwa2_newsletter_unfollow",
    xwa2_newsletter_join_v2 = "xwa2_newsletter_join_v2",
    xwa2_newsletter_leave_v2 = "xwa2_newsletter_leave_v2",
    xwa2_newsletter_change_owner = "xwa2_newsletter_change_owner",
    xwa2_newsletter_demote = "xwa2_newsletter_admin_demote",
    xwa2_newsletter_delete_v2 = "xwa2_newsletter_delete_v2",
    xwa2_fetch_account_reachout_timelock = "xwa2_fetch_account_reachout_timelock",
    xwa2_message_capping_info = "xwa2_message_capping_info",
    xwa2_newsletter_subscribed = "xwa2_newsletter_subscribed",
    xwa2_channel_enforcements = "xwa2_channel_enforcements",
    xwa2_channels_reports = "xwa2_channels_reports",
    xwa2_create_channel_report_appeal_v2 = "xwa2_create_channel_report_appeal_v2",
    xwa2_newsletter_update_user_setting = "xwa2_newsletter_update_user_setting",
    xwa2_newsletter_admin_capabilities = "xwa2_newsletter_admin",
    xwa2_newsletter_admin_info = "xwa2_newsletter_admin",
    admin_profile = "xwa2_newsletter_admin",
    voter_list = "voter_list",
    xwa2_newsletters_reaction_sender_list = "xwa2_newsletters_reaction_sender_list",
    xwa2_newsletter_pin_messages = "xwa2_newsletter_pin_messages",
    xwa2_newsletter_unpin_messages = "xwa2_newsletter_unpin_messages",
    xwa2_newsletter_label_ai_content = "xwa2_newsletter_label_ai_content",
    xwa2_newsletter_label_paid_partnership = "xwa2_newsletter_label_paid_partnership",
    xwa2_newsletter_admin_invite_create = "xwa2_newsletter_admin_invite_create",
    xwa2_newsletter_admin_invite_revoke = "xwa2_newsletter_admin_invite_revoke",
    xwa2_newsletter_admin_invite_accept = "xwa2_newsletter_admin_invite_accept",
    xwa2_newsletters_recommended = "xwa2_newsletters_recommended",
    xwa2_newsletters_similar = "xwa2_newsletters_similar",
    xwa2_username_get = "xwa2_username_get",
    xwa2_username_set = "xwa2_username_set",
    xwa2_username_pin_set = "xwa2_username_pin_set",
    xwa2_update_text_status = "xwa2_update_text_status",
    xwa2_text_status_list = "xwa2_text_status_list",
    xwa2_users_updates_since = "xwa2_users_updates_since",
    xwa2_newsletter_link_preview = "xwa2_newsletter_link_preview",
    xwa2_newsletter_admin_insights = "xwa2_newsletter_admin_insights",
    xwa2_newsletter_followers = "xwa2_newsletter_followers",
    pending_admin_invites = "xwa2_newsletter_admin",
    xwa2_newsletter_question_response_state_update = "xwa2_newsletter_question_response_state_update",
    xwa2_username_check = "xwa2_username_check",
    xwa2_newsletters_directory_list = "xwa2_newsletters_directory_list",
    xwa2_newsletters_directory_search = "xwa2_newsletters_directory_search",
    xwa2_newsletters_directory_category_preview = "xwa2_newsletters_directory_category_preview"
}
export declare enum QueryIds {
    CREATE = "25149874324715067",
    UPDATE_METADATA = "24250201037901610",
    METADATA = "27456920720571478",
    SUBSCRIBERS = "27472091235714801",
    FOLLOW = "24404358912487870",
    UNFOLLOW = "9767147403369991",
    ADMIN_COUNT = "26278439461859188",
    CHANGE_OWNER = "9546742745432473",
    DEMOTE = "9880997548630971",
    DELETE = "30062808666639665",
    REACHOUT_TIMELOCK = "23983697327930364",
    MESSAGE_CAPPING_INFO = "27910975521856601",
    SUBSCRIBED = "25399611239711790",
    ENFORCEMENTS = "27835373536068060",
    CHANNEL_REPORTS = "35936238352686172",
    CREATE_REPORT_APPEAL = "27103316329328467",
    UPDATE_USER_SETTING = "31938993655691868",
    ADMIN_CAPABILITIES = "9801384413216421",
    ADMIN_INFO = "26278439461859188",
    POLL_VOTERS = "9407762219322536",
    REACTION_SENDER_LIST = "29575462448733991",
    PIN_MESSAGES = "27165709459706559",
    UNPIN_MESSAGES = "28007176042216937",
    LABEL_AI_CONTENT = "27909718265289596",
    PAID_PARTNERSHIP_LABEL = "26102375079404865",
    CREATE_ADMIN_INVITE = "9387141988078609",
    REVOKE_ADMIN_INVITE = "9656078347839416",
    ACCEPT_ADMIN_INVITE = "9580828702035549",
    RECOMMENDED = "25806748772361516",
    SIMILAR = "26217043484590756",
    USERNAME_GET = "25347099718279209",
    USERNAME_SET = "25757341163897635",
    USERNAME_PIN_SET = "9749436995157074",
    UPDATE_TEXT_STATUS = "9152604461510864",
    TEXT_STATUS_LIST = "24072923595647473",
    ABOUT_STATUS = "24535500086059408",
    PLAINTEXT_LINK_PREVIEW = "9101130456653613",
    INSIGHTS = "9853618868050977",
    FOLLOWERS = "27472091235714801",
    PENDING_ADMIN_INVITES = "28049623068067370",
    QUESTION_RESPONSE_STATE = "24636260219323456",
    USERNAME_CHECK = "26122779627399568",
    DIRECTORY_LIST = "26125047313831973",
    DIRECTORY_SEARCH = "26301059626252132",
    DIRECTORY_CATEGORIES = "35266481849605779"
}
export type NewsletterUpdate = {
    name?: string;
    description?: string;
    picture?: string;
};
export interface NewsletterCreateResponse {
    id: string;
    state: {
        type: string;
    };
    thread_metadata: {
        creation_time: string;
        description: {
            id: string;
            text: string;
            update_time: string;
        };
        handle: string | null;
        invite: string;
        name: {
            id: string;
            text: string;
            update_time: string;
        };
        picture: {
            direct_path: string;
            id: string;
            type: string;
        };
        preview: {
            direct_path: string;
            id: string;
            type: string;
        };
        subscribers_count: string;
        verification: 'VERIFIED' | 'UNVERIFIED';
    };
    viewer_metadata: {
        mute: 'ON' | 'OFF';
        role: NewsletterViewRole;
    };
}
export interface NewsletterCreateResponse {
    id: string;
    state: {
        type: string;
    };
    thread_metadata: {
        creation_time: string;
        description: {
            id: string;
            text: string;
            update_time: string;
        };
        handle: string | null;
        invite: string;
        name: {
            id: string;
            text: string;
            update_time: string;
        };
        picture: {
            direct_path: string;
            id: string;
            type: string;
        };
        preview: {
            direct_path: string;
            id: string;
            type: string;
        };
        subscribers_count: string;
        verification: 'VERIFIED' | 'UNVERIFIED';
    };
    viewer_metadata: {
        mute: 'ON' | 'OFF';
        role: NewsletterViewRole;
    };
}
export type NewsletterViewRole = 'ADMIN' | 'GUEST' | 'OWNER' | 'SUBSCRIBER';
export interface NewsletterMetadata {
    id: string;
    owner?: string;
    name: string;
    description?: string;
    invite?: string;
    creation_time?: number;
    subscribers?: number;
    picture?: {
        url?: string;
        directPath?: string;
        mediaKey?: string;
        id?: string;
    };
    verification?: 'VERIFIED' | 'UNVERIFIED';
    reaction_codes?: {
        code: string;
        count: number;
    }[];
    mute_state?: 'ON' | 'OFF';
    thread_metadata?: {
        creation_time?: number;
        name?: string;
        description?: string;
    };
}
//# sourceMappingURL=Mex.d.ts.map