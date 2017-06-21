//
//  MaplatCache.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface MaplatCache : NSURLCache <UIWebViewDelegate>

- (void)webView:(UIWebView *)webView callApp2WebWithKey:(NSString *)key value:(NSString *)value;

@end

@interface UIView (FindUIViewController)
- (UIViewController *) firstAvailableUIViewController;
- (id) traverseResponderChainForUIViewController;
@end
