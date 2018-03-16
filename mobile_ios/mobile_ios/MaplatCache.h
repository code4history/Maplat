//
//  MaplatCache.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol MaplatCacheDelegate;

@interface MaplatCache : NSURLCache <UIWebViewDelegate>

@property (nonatomic, assign) id <MaplatCacheDelegate> delegate;

@end

@protocol MaplatCacheDelegate <NSObject>
@optional
- (void)onCallWeb2AppWithKey:(NSString *)key value:(NSString *)value;
@end
