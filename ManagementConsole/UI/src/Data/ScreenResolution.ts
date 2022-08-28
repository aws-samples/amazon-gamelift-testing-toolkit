import {Game} from "../Game";

export class ScreenResolution
{
    public static RES_1080P : string = "1080P";
    public static RES_720P : string = "720P";

    private static _width: number = 1920;
    private static _height: number = 1080;
    private static _displayResolution: string = "1080P";

    public static get displayResolution():string
    {
        return this._displayResolution;
    }

    public static get width():number
    {
        return this._width;
    }

    public static get height():number
    {
        return this._height;
    }

    public static set displayResolution (resolution:string)
    {
        this._displayResolution = resolution;
        if (this._displayResolution=="720P")
        {
            this._width = 1280;
            this._height = 720;
        }
        else
        {
            this._width = 1920;
            this._height = 1080;
        }
    }

    public static updateUserResolution(width, height)
    {
        if (width < 1920 || height < 1080)
        {
            this.displayResolution = ScreenResolution.RES_720P;
        }
        else
        {
            this.displayResolution = ScreenResolution.RES_1080P;
        }
    }
}