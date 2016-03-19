declare module 'twitter' {
    interface Callback {
        (err: Error, tweet: any, response: any): any;
    }
    
    interface Tweet {
        status: string
    }
    
    interface Twitter_Option {
        consumer_key: string,
        consumer_secret: string,
        access_token_key: string,
        access_token_secret: string,
    }
    
    interface Twitter_Static {
        new(option: Twitter_Option): Twitter_Instance
    }
    
    interface Twitter_Instance {
        post(path: string, Tweet, Callback): void;
    }

    var Twitter: Twitter_Static;
	export = Twitter;
}
