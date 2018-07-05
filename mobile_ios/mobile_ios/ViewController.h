//
//  ViewController.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

@import UIKit;

@class MaplatView;

@interface ViewController : UIViewController

@property (retain, nonatomic) MaplatView *maplatView;

@end

@interface UIView (FindUIViewController)
- (UIViewController *) firstAvailableUIViewController;
- (id) traverseResponderChainForUIViewController;
@end
