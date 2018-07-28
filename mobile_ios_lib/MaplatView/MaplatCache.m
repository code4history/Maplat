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
    NSString *ext = url.pathExtension;
    NSString *path = url.path;
    NSString *host = url.host;
    
    NSBundle *mainBundle = [NSBundle mainBundle];
    NSString *mainAssetDirectory = [mainBundle bundlePath];
    
    NSBundle *maplatBundle = [NSBundle bundleForClass:[self class]];
    NSString *maplatResDirectory = [maplatBundle pathForResource:@"Maplat" ofType:@"bundle"];
    
    if ([host isEqualToString:@"localresource"]) {
        NSString *file = [mainAssetDirectory stringByAppendingString:path];
        NSString *resFile = [maplatResDirectory stringByAppendingString:path];
        NSFileManager *fm = [NSFileManager defaultManager];
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
        NSData *data = nil;
        if ([fm fileExistsAtPath:resFile]) {
            data = [NSData dataWithContentsOfFile:resFile];
        } else if ([fm fileExistsAtPath:file]) {
            data = [NSData dataWithContentsOfFile:file];
        }
        if (data) {
            NSURLResponse *res = [[NSURLResponse alloc] initWithURL:url MIMEType:mime expectedContentLength:data.length textEncodingName:@"UTF-8"];

            NSCachedURLResponse *cached = [[NSCachedURLResponse alloc] initWithResponse:res data:data];
            return cached;
        }
    }
    
    return [super cachedResponseForRequest:request];
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
    NSURL *URL = [request URL];
    if ([[URL scheme] isEqualToString:@"maplatbridge"]) {
        NSString *key = @"";
        NSString *value = @"";
        for (NSString *param in [[URL query] componentsSeparatedByString:@"&"]) {
            NSArray *elts = [param componentsSeparatedByString:@"="];
            if ([elts count] < 2) continue;
            NSString *lkey = (NSString *)[elts objectAtIndex:0];
            NSString *lval = (NSString *)[elts objectAtIndex:1];
            if ([lkey isEqualToString:@"key"]) key = [lval stringByRemovingPercentEncoding];
            if ([lkey isEqualToString:@"value"]) value = [lval stringByRemovingPercentEncoding];
        }
        
        if (_delegate) {
            [_delegate onCallWeb2AppWithKey:key value:value];
        }
        
        return NO;
    }
    
    return YES;
}
@end
