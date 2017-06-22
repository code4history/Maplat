//
//  ViewController.m
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import "ViewController.h"
#import <UIKit/UIKit.h>
#import "MaplatCache.h"

@interface ViewController ()

@end

@implementation ViewController : UIViewController

- (void)loadView
{
    [super loadView];
    
    // WKWebView インスタンスの生成
    self.webView = [UIWebView new];
    
    self.view = self.webView;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    [NSThread sleepForTimeInterval:10]; //Safariのデバッガを繋ぐための時間。本番では不要。
    MaplatCache *cache = (MaplatCache *)[NSURLCache sharedURLCache];
    self.webView.delegate = cache;
    [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localresource/mobile_sample.html"]]];
}


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


@end
