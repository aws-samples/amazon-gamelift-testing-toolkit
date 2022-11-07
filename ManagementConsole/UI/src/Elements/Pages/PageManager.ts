import {Popup} from "../Abstract/Popup";
import {Page} from "../Abstract/Page";

export class PageManager
{
    protected static _pages: Record<string, Page>={};
    protected static _currentPageName: string=null;

    public static resetPages()
    {
        this._pages = {};
    }

    public static get pageNames()
    {
        return Object.keys(this._pages);
    }

    public static get pages()
    {
        return Object.values(this._pages);
    }

    public static registerPage(page:Page)
    {
        if (page!=null)
        {
            this._pages[page.domId] = page;
        }

        return page;
    }

    public static getCurrentPage()
    {
        return this._pages[this._currentPageName];
    }

    public static switchPage(pageName:string, pageData:any=null)
    {
        console.log("SWITCH PAGE", pageName);
        console.log(this._pages);
        if (this._pages[pageName]!=null)
        {
            this.pages.map(page=>page.hidePage());
            this._pages[pageName].setPageData(pageData);
            this._pages[pageName].showPage();
            this._currentPageName = pageName;
        }
    }

    public static showPage()
    {

    }

}