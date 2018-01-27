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
    if ([[URL scheme] isEqualToString:@"jsbridge"]) {
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
        
        if ([key isEqualToString:@"callApp2Web"] && [value isEqualToString:@"ready"]) {
            [self webView:webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.69994722,\"longitude\":141.1501111,\"data\":{\"id\":1,\"data\":1}}"];
            [self webView:webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.7006006,\"longitude\":141.1529555,\"data\":{\"id\":5,\"data\":5}}"];
            [self webView:webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.701599,\"longitude\":141.151995,\"data\":{\"id\":6,\"data\":6}}"];
            [self webView:webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.703736,\"longitude\":141.151137,\"data\":{\"id\":7,\"data\":7}}"];
            [self webView:webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.7090232,\"longitude\":141.1521671,\"data\":{\"id\":9,\"data\":9}}"];
        } else {
            NSString *message = [NSString stringWithFormat:@"%@:%@", key, value];
            
            UIAlertController *alert = [UIAlertController alertControllerWithTitle:nil
                                                                           message:message
                                                                    preferredStyle:UIAlertControllerStyleAlert];
            UIViewController *controller = [webView firstAvailableUIViewController];
            [controller presentViewController:alert animated:YES completion:nil];
            
            int duration = 1; // duration in seconds
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, duration * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                [alert dismissViewControllerAnimated:YES completion:nil];
            });
        }
        
        if (_delegate) {
            [_delegate maplatCache:self didReceiveKey:key value:value];
        }
        
        return NO;
    }
    
    return YES;
}

- (void)webView:(UIWebView *)webView callApp2WebWithKey:(NSString *)key value:(NSString *)value
{
    [webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"javascript:jsBridge.callApp2Web('%@','%@');", key, value]];
}

//- (BOOL)webView:(UIWebView*)webView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType {
//    NSURL *URL = [request URL];
//    if ([[URL scheme] isEqualToString:@"yourscheme"]) {
//        // parse the rest of the URL object and execute functions
//    }
//}


@end

@implementation UIView (FindUIViewController)
- (UIViewController *) firstAvailableUIViewController {
    // convenience function for casting and to "mask" the recursive function
    return (UIViewController *)[self traverseResponderChainForUIViewController];
}

- (id) traverseResponderChainForUIViewController {
    id nextResponder = [self nextResponder];
    if ([nextResponder isKindOfClass:[UIViewController class]]) {
        return nextResponder;
    } else if ([nextResponder isKindOfClass:[UIView class]]) {
        return [nextResponder traverseResponderChainForUIViewController];
    } else {
        return nil;
    }
}
@end
