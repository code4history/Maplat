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

@property (nonatomic, strong) MaplatCache *cache;

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
    _cache = (MaplatCache *)[NSURLCache sharedURLCache];
    _cache.delegate = self;
    
    self.webView.delegate = _cache;
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

- (void)onCallWeb2AppWithKey:(NSString *)key value:(NSString *)value {
    NSLog(@"onCallWeb2AppWithKey:%@ value:%@", key, value);
    if ([key isEqualToString:@"callApp2Web"] && [value isEqualToString:@"ready"]) {
        [_locationManager startUpdatingLocation];
        [_cache webView:_webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.69994722,\"longitude\":141.1501111,\"data\":{\"id\":1,\"data\":1}}"];
        [_cache webView:_webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.7006006,\"longitude\":141.1529555,\"data\":{\"id\":5,\"data\":5}}"];
        [_cache webView:_webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.701599,\"longitude\":141.151995,\"data\":{\"id\":6,\"data\":6}}"];
        [_cache webView:_webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.703736,\"longitude\":141.151137,\"data\":{\"id\":7,\"data\":7}}"];
        [_cache webView:_webView callApp2WebWithKey:@"setMarker" value:@"{\"latitude\":39.7090232,\"longitude\":141.1521671,\"data\":{\"id\":9,\"data\":9}}"];
    } else {
        NSString *message = [NSString stringWithFormat:@"%@:%@", key, value];
        
        UIAlertController *alert = [UIAlertController alertControllerWithTitle:nil
                                                                       message:message
                                                                preferredStyle:UIAlertControllerStyleAlert];
        UIViewController *controller = [_webView firstAvailableUIViewController];
        [controller presentViewController:alert animated:YES completion:nil];
        
        int duration = 1; // duration in seconds
        
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, duration * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
            [alert dismissViewControllerAnimated:YES completion:nil];
        });
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
