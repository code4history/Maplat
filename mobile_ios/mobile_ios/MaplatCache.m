//
//  MaplatCache.m
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import "MaplatCache.h"

@implementation MaplatCache

- (NSCachedURLResponse*)cachedResponseForRequest:(NSURLRequest*)request
{
    NSURL *url = [request URL];
    NSString *urlString = [url absoluteString];
    NSString *ext = url.pathExtension;
    NSString *path = url.path;
    NSString *host = url.host;
    NSBundle *bundle = [NSBundle mainBundle];
    NSString *assetDirectory = [bundle bundlePath];

    if ([host isEqualToString:@"localresource"]) {
        NSString *file = [assetDirectory stringByAppendingString:path];
        NSFileManager *fm = [NSFileManager defaultManager];
        if ([fm fileExistsAtPath:file]) {
            NSString *mime = [ext isEqualToString:@"html"] ? @"text/html" :
                [ext isEqualToString:@"js"] ? @"application/javascript" :
                 [ext isEqualToString:@"json"] ? @"application/json" :
                  [ext isEqualToString:@"jpg"] ? @"image/jpeg" :
                   [ext isEqualToString:@"png"] ? @"image/png" :
                    [ext isEqualToString:@"css"] ? @"text/css" :
                     [ext isEqualToString:@"gif"] ? @"image/gif" :
                      [ext isEqualToString:@"woff"] ? @"application/font-woff" :
                       [ext isEqualToString:@"woff2"] ? @"application/font-woff2" :
                        [ext isEqualToString:@"ttf"] ? @"application/font-ttf" :
                         [ext isEqualToString:@"eot"] ? @"application/vnd.ms-fontobject" :
                          [ext isEqualToString:@"otf"] ? @"application/font-otf" :
                           [ext isEqualToString:@"svg"] ? @"image/svg+xml" :
                            @"text/plain";
            NSData *data = [NSData dataWithContentsOfFile:file];
            NSURLResponse *res = [[NSURLResponse alloc] initWithURL:url MIMEType:mime expectedContentLength:data.length textEncodingName:@"UTF-8"];

            NSCachedURLResponse *cached = [[NSCachedURLResponse alloc] initWithResponse:res data:data];
            return cached;
        }
        
        NSFileManager *fs = [NSFileManager defaultManager];
        NSArray *list = [fs contentsOfDirectoryAtPath:assetDirectory error:nil];
        //NSLog(newUrl);
    }
    
    return [super cachedResponseForRequest:request];
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
    NSURL *URL = [request URL];
    if ([[URL scheme] isEqualToString:@"jsBridge"]) {
        NSString *key = @"";
        NSString *value = @"";
        for (NSString *param in [[URL query] componentsSeparatedByString:@"&"]) {
            NSArray *elts = [param componentsSeparatedByString:@"="];
            if ([elts count] < 2) continue;
            NSString *lkey = (NSString *)[elts objectAtIndex:0];
            NSString *lval = (NSString *)[elts objectAtIndex:1];
            if ([lkey isEqualToString:@"key"]) key = lval;
            if ([lkey isEqualToString:@"value"]) value = lval;
        }
        
        //if (key.equals("callApp2Web") && data.equals("ready")) {
        //    this.callApp2Web("setMarker", "{\"latitude\":39.69994722,\"longitude\":141.1501111,\"data\":{\"id\":1,\"data\":1}}");
        //    this.callApp2Web("setMarker", "{\"latitude\":39.7006006,\"longitude\":141.1529555,\"data\":{\"id\":5,\"data\":5}}");
        //    this.callApp2Web("setMarker", "{\"latitude\":39.701599,\"longitude\":141.151995,\"data\":{\"id\":6,\"data\":6}}");
        //    this.callApp2Web("setMarker", "{\"latitude\":39.703736,\"longitude\":141.151137,\"data\":{\"id\":7,\"data\":7}}");
        //    this.callApp2Web("setMarker", "{\"latitude\":39.7090232,\"longitude\":141.1521671,\"data\":{\"id\":9,\"data\":9}}");
        //} else {
        //    Toast.makeText(mContext, key + ":" + data, Toast.LENGTH_LONG).show();
        //}
        
        return NO;
    }
    
    return YES;
}

//- (BOOL)webView:(UIWebView*)webView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType {
//    NSURL *URL = [request URL];
//    if ([[URL scheme] isEqualToString:@"yourscheme"]) {
//        // parse the rest of the URL object and execute functions
//    }
//}


@end
