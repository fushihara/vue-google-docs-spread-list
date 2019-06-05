export class KeywordFilter {
    private readonly keywords: string[];
    constructor(keyword: string) {
        this.keywords = keyword.replace(/[　| ]+/g, " ").trim().split(/\s+/).filter(a => a != "").map(a => a.toLowerCase());
    }
    public isMatch(searchText: string): boolean {
        if (this.keywords.length == 0) {
            return true;
        }
        // searchText あいうえお
        // keywords   へ うえ お
        const lowSearchText = searchText.toLowerCase();
        return this.keywords.some(keyword => {
            return lowSearchText.includes(keyword);
        })
    }
}