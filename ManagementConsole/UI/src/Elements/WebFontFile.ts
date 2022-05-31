// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser'

import WebFontLoader from 'webfontloader'

export default class WebFontFile extends Phaser.Loader.File
{
    /**
     * @param {Phaser.Loader.LoaderPlugin} loader
     * @param {string | string[]} fontNames
     * @param {string} [service]
     */

    protected _fontNames:string[];
    protected _service:string;
    protected _fontsLoadedCount:number;

    /**
     * @param {Phaser.Loader.LoaderPlugin} loader
     * @param {string | string[]} fontNames
     * @param {string} [service]
     */
    constructor(loader, fontNames, service = 'google')
    {
        super(loader, {
            type: 'webfont',
            key: fontNames.toString()
        })

        this._fontNames = Array.isArray(fontNames) ? fontNames : [fontNames]
        this._service = service

        this._fontsLoadedCount = 0
    }

    load()
    {
        const config = {
            fontactive: (familyName) => {
                this.checkLoadedFonts(familyName)
            },
            fontinactive: (familyName) => {
                this.checkLoadedFonts(familyName)
            }
        }

        switch (this._service)
        {
            case 'google':
                config[this._service] = this.getGoogleConfig()
                break

            case 'adobe-edge':
                config['typekit'] = this.getAdobeEdgeConfig()
                break

            default:
                throw new Error('Unsupported font service')
        }


        WebFontLoader.load(config)
    }

    getGoogleConfig()
    {
        return {
            families: this._fontNames
        }
    }

    getAdobeEdgeConfig()
    {
        return {
            id: this._fontNames.join(';'),
            api: '//use.edgefonts.net'
        }
    }

    checkLoadedFonts(familyName)
    {
        if (this._fontNames.indexOf(familyName) < 0)
        {
            return
        }

        ++this._fontsLoadedCount
        if (this._fontsLoadedCount >= this._fontNames.length)
        {
            this.loader.nextFile(this, true)
        }
    }
}