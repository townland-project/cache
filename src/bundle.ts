export class CacheStorage {
    private _self!: Cache
    private _key: string
    private _prefix = 'townland'
    private _stack: string[] = []
    private _callback!: Callback;

    /**
     * Get cache key
     */
    private get _Key(): string {
        return (`${this._prefix}:${this._key}`).toLowerCase()
    }

    constructor(key: string) {
        this._key = key
        this._Open()
    }

    /**
     * Open cache after run we add stacked adds and execute OnOpen callback
     */
    private async _Open(): Promise<void> {
        try {
            this._self = await caches.open(this._Key)
            if (this._stack.length != 0) this.AddAll(...this._stack)
            if (this._callback) this._callback()
        } catch {
            console.error(`Cannot open cache!`)
        }
    }

    /**
     * Is cache open and available
     */
    private _IsOpen(): boolean {
        return this._self != undefined
    }

    /**
     * On cache open callback
     * @param callback on open callback
     */
    public OnOpen(callback: Callback): void {
        this._callback = callback
    }

    /**
     * Add a request url to cache
     * @param url request url
     */
    public Add(url: string): void {
        if (!this._IsOpen()) this._stack.push(url)
        else this._self.add(url)
    }

    /**
     * Add a list of request urls to cache
     * @param url request urls
     */
    public AddAll(...url: string[]): void {
        if (!this._IsOpen()) this._stack.push(...url)
        else this._self.addAll(url)
    }

    /**
     * Add a restapi request to cache
     * @param url request url
     * @returns {Response} HTTP Response
     */
    public async AddJson(url: string): Promise<Response | undefined> {
        try {
            const req = await fetch(url)
            await this._self.put(new Request(url), req.clone())
            return req
        } catch (error) {
            console.error('Failed cache json!')
            return Promise.reject()
        }
    }

    /**
     * Get a restapi cached request from cache and it didn't exist, Request to server and will cache
     * @param url request url
     * @returns {Response} HTTP Response
     */
    public async GetJson(url: string): Promise<Response | undefined> {
        try {
            if (!this._IsOpen()) return Promise.reject()
            const res = await this._self.match(url)
            if (res) return res
            else return this.AddJson(url)
        } catch (error) {
            return Promise.reject()
        }
    }

    /**
     * Add image to cache
     * @param url request url
     * @returns {Blob} Image Blob
     */
    public async AddImage(url: string): Promise<Blob> {
        try {
            const req = await fetch(url)
            await this._self.put(new Request(url), req.clone())
            return req.blob()
        } catch (error) {
            console.error('Failed cache image!')
            return Promise.reject()
        }
    }

    /**
     * Get image from cache and if it didm't exist, Load image and will cache
     * @param url request url
     * @returns {Blob} Image Blob
     */
    public async GetImage(url: string): Promise<Blob> {
        try {
            if (!this._IsOpen()) return Promise.reject()
            const res = await this._self.match(url)
            if (res) return res.blob()
            else return this.AddImage(url)
        } catch (error) {
            return Promise.reject()
        }
    }

    /**
     * Get cached http response
     * @param url request url
     * @returns {Response | undefined} HTTP Response
     */
    public Get(url: string): Promise<Response | undefined> {
        if (!this._IsOpen()) return Promise.resolve(undefined)
        return this._self.match(url)
    }

    /**
     * Delete cached http request
     * @param url request url
     */
    public Delete(url: string): void {
        if (!this._IsOpen()) return;
        this._self.delete(url)
    }

    /**
     * Clear all cache
     */
    public async Clear(): Promise<void> {
        try {
            await caches.delete(this._Key)
            this._self = await caches.open(this._Key)
        } catch (error) {
            console.error(`Cannot delete cache!`)
        }
    }

    /**
     * Get list of cached url
     * @returns {string[]} List of cached url
     */
    public async Keys(): Promise<string[]> {
        if (!this._IsOpen()) return Promise.resolve([])
        return (await this._self.keys()).map(request => request.url)
    }

    /**
     * Check url is cached or not
     * @param url 
     * @returns {boolean} exist or not
     */
    public async Has(url: string): Promise<boolean> {
        if (!this._IsOpen()) return Promise.resolve(false)
        return await this._self.match(url) != undefined
    }
}

export const Caches = {
    'Character': new CacheStorage('character'),
    'Extera': new CacheStorage('extera'),
    'Room': new CacheStorage('room'),
}

interface ICache {
    [key: string]: CacheStorage
}

interface Callback {
    (): void
}

/**
 * Add a new Cache to list
 * @param key Key of CacheStorage
 * @returns {CacheStorage} A new created CacheStorage
 */
export function AddCacheStorage(key: string): CacheStorage {
    if (key in Caches) return (Caches as ICache)[key]
    const storage = new CacheStorage(key);
    (Caches as ICache)[key] = storage
    return storage
}

/**
 * Remove CacheStorage from list
 * @param key Key Of CacheStorage
 */
export function RemoveCacheStorage(key: string): void {
    delete (Caches as ICache)[key]
}
