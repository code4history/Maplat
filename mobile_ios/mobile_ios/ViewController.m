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
#import "JsBridge.h"

@interface ViewController () <CLLocationManagerDelegate, JsBridgeDelegate>

@property (nonatomic, strong) CLLocationManager *locationManager;

@property (nonatomic, strong) JsBridge *jsBridge;

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

    [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localresource/mobile_sample.html"]]];
    
    _jsBridge = [[JsBridge alloc] initWithWebView:self.webView];
    _jsBridge.delegate = self;
    
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

#pragma mark - JsBridgeDelegate

- (void)onReady
{
    [_locationManager startUpdatingLocation];
    [_jsBridge addMarkerWithLatitude:39.69994722 longitude:141.1501111 markerId:1 markerData:@"001"];
    [_jsBridge addMarkerWithLatitude:39.7006006 longitude:141.1529555 markerId:5 markerData:@"005"];
    [_jsBridge addMarkerWithLatitude:39.701599 longitude:141.151995 markerId:6 markerData:@"006"];
    [_jsBridge addMarkerWithLatitude:39.703736 longitude:141.151137 markerId:7 markerData:@"007"];
    [_jsBridge addMarkerWithLatitude:39.7090232 longitude:141.1521671 markerId:9 markerData:@"009"];
}

- (void)onClickPoiWithMarkerId:(int)markerId markerData:(id)markerData
{
    NSString *message = [NSString stringWithFormat:@"clickPoi ID:%d DATA:%@", markerId, markerData];
    
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

#pragma mark - Location Manager

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation {
    if (newLocation.horizontalAccuracy < 0) return;

    NSTimeInterval locationAge = -[newLocation.timestamp timeIntervalSinceNow];
    if (locationAge > 5.0) return;
    
    NSLog(@"location updated. newLocation:%@", newLocation);
    
    [_jsBridge setGPSMarkerWithLatitude:newLocation.coordinate.latitude longitude:newLocation.coordinate.longitude accuracy:newLocation.horizontalAccuracy];
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
