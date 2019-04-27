export namespace GoogleApi {
    export type SortType = "last_view_me" | "last_update_me" | "last_update" | "createdTime" | "title";
    export function getAuthStartUrl(val: { クライアントID: string, リダイレクトURI: string, }): string {
        const urlBase = `https://accounts.google.com/o/oauth2/auth`;
        const params = [];
        const スコープs = [
            "https://www.googleapis.com/auth/drive.metadata.readonly",
        ];
        params.push(`response_type=code`);
        params.push(`client_id=${val.クライアントID}`);
        params.push(`redirect_uri=${val.リダイレクトURI}`);
        params.push(`scope=${encodeURIComponent(スコープs.join(" "))}`);
        params.push(`access_type=offline`);
        params.push(`approval_prompt=force`);
        const accessUrl = `${urlBase}?${params.join("&")}`;
        return accessUrl;
    }
    export async function getAccessTokenNewGet(requestCode: string, リダイレクトURL: string, クライアントID: string, クライアントシークレット: string): Promise<{ accessToken: string, expiresInSecond: number, refreshToken: string }> {
        const postValues = [];
        postValues.push(`code=${encodeURIComponent(requestCode)}`);
        postValues.push(`client_id=${encodeURIComponent(クライアントID)}`);
        postValues.push(`client_secret=${encodeURIComponent(クライアントシークレット)}`);
        postValues.push(`redirect_uri=${encodeURIComponent(リダイレクトURL)}`);
        postValues.push(`grant_type=authorization_code`);
        postValues.push(`access_type=offline`);
        return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: postValues.join("&")
        })
            .then(async request => {
                return request.json().then(json => {
                    const accessToken = String(json.access_token || "");
                    const expiresInSecond = Number(json.expires_in || "0");
                    const refreshToken = String(json.refresh_token || "");
                    return {
                        accessToken, expiresInSecond, refreshToken
                    }
                });
            });

    }
    export async function getAccessTokenRefresh(リフレッシュトークン: string, クライアントID: string, クライアントシークレット: string): Promise<{ accessToken: string, expiresInSecond: number }> {
        const postValues = [];
        postValues.push(`refresh_token=${encodeURIComponent(リフレッシュトークン)}`);
        postValues.push(`client_id=${encodeURIComponent(クライアントID)}`);
        postValues.push(`client_secret=${encodeURIComponent(クライアントシークレット)}`);
        postValues.push(`grant_type=refresh_token`);
        postValues.push(`access_type=offline`);
        return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: postValues.join("&")
        }).then(async request => {
            return request.json().then(json => {
                const accessToken = String(json.access_token || "");
                const expiresInSecond = Number(json.expires_in || "0");
                return {
                    accessToken, expiresInSecond
                }
            });
        });
    }
    export async function getDataFromApi(sortType: SortType, accessToken: string): Promise<Response> {
        let orderBy = "";
        switch (sortType) {
            case "last_view_me": orderBy = "viewedByMeTime desc"; break;
            case "last_update_me": orderBy = "modifiedByMeTime desc"; break;
            case "last_update": orderBy = "modifiedTime desc"; break;
            case "title": orderBy = "name"; break;
            case "createdTime": orderBy = "createdTime desc"; break;
        }
        return fetch(
            `https://www.googleapis.com/drive/v3/files?` +
            [
                "orderBy=" + encodeURIComponent(orderBy),
                "q=" + encodeURIComponent("trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document')"),
                "fields=" + encodeURIComponent("files(kind,id,name,mimeType,iconLink,viewedByMe,viewedByMeTime,createdTime,modifiedTime,modifiedByMeTime,modifiedByMe)"),
                "pageSize=1000",
            ].join("&"),
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
    }
}