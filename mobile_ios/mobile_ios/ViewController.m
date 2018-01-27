//
//  ViewController.m
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import "ViewController.h"
#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import "MaplatCache.h"

@interface ViewController () <CLLocationManagerDelegate, MaplatCacheDelegate>

@property (nonatomic, strong) CLLocationManager *locationManager;

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
    cache.delegate = self;
    
    self.webView.delegate = cache;
    [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localresource/mobile_sample.html"]]];
    
    _locationManager = [[CLLocationManager alloc] init];
    _locationManager.delegate = self;
    _locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation;
    _locationManager.distanceFilter = kCLDistanceFilterNone;
    if ([_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
        [_locationManager requestWhenInUseAuthorization];
    }
}


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - MaplatCacheDelegate

- (void)maplatCache:(MaplatCache *)maplatCache didReceiveKey:(NSString *)key value:(NSString *)value {
    NSLog(@"didReceiveKey:%@ value:%@", key, value);
    
    if ([key isEqualToString:@"callApp2Web"]) {
        if ([value isEqualToString:@"ready"]) {
            [_locationManager startUpdatingLocation];
        }
    }
}

#pragma mark - Location Manager

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation {
    if (newLocation.horizontalAccuracy < 0) return;

    NSTimeInterval locationAge = -[newLocation.timestamp timeIntervalSinceNow];
    if (locationAge > 5.0) return;
    
    NSLog(@"location updated. newLocation:%@", newLocation);
    
    NSString *value = [NSString stringWithFormat:@"{\"latitude\":%f,\"longitude\":%f,\"accuracy\":%f}", newLocation.coordinate.latitude, newLocation.coordinate.longitude, newLocation.horizontalAccuracy];
    [self callApp2WebWithKey:@"setGPSMarker" value:value];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    if (error.code != kCLErrorLocationUnknown) {
        [self.locationManager stopUpdatingLocation];
        self.locationManager.delegate = nil;
    }
}

#pragma mark -


- (void)callApp2WebWithKey:(NSString *)key value:(NSString *)value
{
    [_webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"javascript:jsBridge.callApp2Web('%@','%@');", key, value]];
}


@end
