//
//  ViewController.m
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import "ViewController.h"

@import UIKit;
@import CoreLocation;
@import MaplatView;

const double BaseLongitude = 141.1529555;
const double BaseLatitude = 39.7006006;

@interface ViewController () <CLLocationManagerDelegate, MaplatViewDelegate>

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (retain, nonatomic) NSString *nowMap;
@property (nonatomic) double nowDirection;
@property (nonatomic) double nowRotation;

@property (nonatomic) double defaultLongitude;
@property (nonatomic) double defaultLatitude;

@end

@implementation ViewController : UIViewController

- (void)loadView
{
    [super loadView];

    NSDictionary *setting = @{ @"app_name" : @"モバイルアプリ",
                               @"sources" : @[
                                       @"gsi",
                                       @"osm",
                                       @{
                                           @"mapID" : @"morioka_ndl"
                                           }
                                       ],
                               @"pois" : @[]
                               };
    _maplatView = [[MaplatView alloc] initWithFrame:[UIScreen mainScreen].bounds appID:@"mobile" setting:setting];
    _maplatView.delegate = self;

    self.view = self.maplatView;
    
    self.nowMap = @"morioka_ndl";
    self.nowDirection = 0;
    self.nowRotation = 0;
    
    // テストボタンの生成
    for (int i=1; i<=7; i++) {
        UIButton *button = [UIButton new];
        button.tag = i;
        button.frame = CGRectMake(10, i*60, 120, 40);
        button.alpha = 0.8;
        button.backgroundColor = [UIColor lightGrayColor];
        switch (i) {
            case 1:
                [button setTitle:@"地図切替" forState:UIControlStateNormal];
                break;
            case 2:
                [button setTitle:@"ﾏｰｶｰ追加" forState:UIControlStateNormal];
                break;
            case 3:
                [button setTitle:@"ﾏｰｶｰ消去" forState:UIControlStateNormal];
                break;
            case 4:
                [button setTitle:@"地図移動" forState:UIControlStateNormal];
                break;
            case 5:
                [button setTitle:@"東を上" forState:UIControlStateNormal];
                break;
            case 6:
                [button setTitle:@"右を上" forState:UIControlStateNormal];
                break;
            case 7:
                [button setTitle:@"表示地図情報" forState:UIControlStateNormal];
                break;
            default:
                [button setTitle:[NSString stringWithFormat:@"button %d", i] forState:UIControlStateNormal];
                break;
        }
        [button addTarget:self action:@selector(testButton:) forControlEvents:UIControlEventTouchUpInside];
        [self.view addSubview:button];
    }

}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    //[NSThread sleepForTimeInterval:10]; //Safariのデバッガを繋ぐための時間。本番では不要。
    _defaultLongitude = 0;
    _defaultLatitude = 0;
    
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

#pragma mark - MaplatBridgeDelegate

- (void)onReady
{
    [self addMarkers];
    [_locationManager startUpdatingLocation];
}

- (void)onClickMarkerWithMarkerId:(long)markerId markerData:(id)markerData
{
    NSString *message = [NSString stringWithFormat:@"clickMarker ID:%ld DATA:%@", markerId, markerData];
    [self toast:message];
}

- (void)onChangeViewpointWithX:(double)x y:(double)y latitude:(double)latitude longitude:(double)longitude mercatorX:(double)mercator_x mercatorY:(double)mercator_y zoom:(double)zoom mercZoom:(double)merc_zoom direction:(double)direction rotation:(double)rotation
{
    NSLog(@"XY: (%f, %f) LatLong: (%f, %f) Mercator (%f, %f) zoom: %f mercZoom: %f direction: %f rotation %f", x, y, latitude, longitude, mercator_x, mercator_y, zoom, merc_zoom, direction, rotation);
}

- (void)onOutOfMap
{
    [self toast:@"地図範囲外です"];
}

- (void)onClickMapWithLatitude:(double)latitude longitude:(double)longitude
{
    NSString *message = [NSString stringWithFormat:@"clickMap latitude:%f longitude:%f", latitude, longitude];
    [self toast:message];
}

- (void)addMarkers
{
    [_maplatView addLineWithLngLat:@[@[@141.1501111, @39.69994722], @[@141.1529555, @39.7006006]] stroke:nil];
    [_maplatView addLineWithLngLat:@[@[@141.151995, @39.701599], @[@141.151137, @39.703736], @[@141.1521671, @39.7090232]]
                                stroke:@{@"color":@"#ffcc33", @"width":@2}];
    [_maplatView addMarkerWithLatitude:39.69994722 longitude:141.1501111 markerId:1 stringData:@"001"];
    [_maplatView addMarkerWithLatitude:39.7006006 longitude:141.1529555 markerId:5 stringData:@"005"];
    [_maplatView addMarkerWithLatitude:39.701599 longitude:141.151995 markerId:6 stringData:@"006"];
    [_maplatView addMarkerWithLatitude:39.703736 longitude:141.151137 markerId:7 stringData:@"007"];
    [_maplatView addMarkerWithLatitude:39.7090232 longitude:141.1521671 markerId:9 stringData:@"009"];
}

#pragma mark - Location Manager

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation {
    if (newLocation.horizontalAccuracy < 0) return;

    NSTimeInterval locationAge = -[newLocation.timestamp timeIntervalSinceNow];
    if (locationAge > 5.0) return;
    
    NSLog(@"location updated. newLocation:%@", newLocation);

    double latitude;
    double longitude;
    if (_defaultLatitude == 0 || _defaultLongitude == 0) {
        _defaultLatitude = newLocation.coordinate.latitude;
        _defaultLongitude = newLocation.coordinate.longitude;
        latitude = BaseLatitude;
        longitude = BaseLongitude;
    } else {
        latitude = BaseLatitude - _defaultLatitude + newLocation.coordinate.latitude;
        longitude = BaseLongitude - _defaultLongitude + newLocation.coordinate.longitude;
    }
    
    [_maplatView setGPSMarkerWithLatitude:latitude longitude:longitude accuracy:newLocation.horizontalAccuracy];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    if (error.code != kCLErrorLocationUnknown) {
        [self.locationManager stopUpdatingLocation];
        self.locationManager.delegate = nil;
    }
}

#pragma mark - test

// テストボタン　アクション
- (void)testButton:(UIButton *) button {
    NSString *nextMap;
    double nextDirection;
    double nextRotation;
    switch((int)button.tag) {
        case 1:
            nextMap = [self.nowMap isEqualToString:@"morioka_ndl"] ? @"gsi" : @"morioka_ndl";
            [_maplatView changeMap:nextMap];
            self.nowMap = nextMap;
            break;
        case 2:
            [self addMarkers];
            break;
        case 3:
            [_maplatView clearLine];
            [_maplatView clearMarker];
            break;
        case 4:
            [_maplatView setViewpointWithLatitude:39.69994722 longitude:141.1501111];
            break;
        case 5:
            if (_nowDirection == 0) {
                nextDirection = -90;
                [button setTitle:@"南を上" forState:UIControlStateNormal];
            } else if (_nowDirection == -90) {
                nextDirection = 180;
                [button setTitle:@"西を上" forState:UIControlStateNormal];
            } else if (_nowDirection == 180) {
                nextDirection = 90;
                [button setTitle:@"北を上" forState:UIControlStateNormal];
            } else {
                nextDirection = 0;
                [button setTitle:@"東を上" forState:UIControlStateNormal];
            }
            [_maplatView setDirection:nextDirection];
            _nowDirection = nextDirection;
            break;
        case 6:
            if (_nowRotation == 0) {
                nextRotation = -90;
                [button setTitle:@"下を上" forState:UIControlStateNormal];
            } else if (_nowRotation == -90) {
                nextRotation = 180;
                [button setTitle:@"左を上" forState:UIControlStateNormal];
            } else if (_nowRotation == 180) {
                nextRotation = 90;
                [button setTitle:@"上を上" forState:UIControlStateNormal];
            } else {
                nextRotation = 0;
                [button setTitle:@"右を上" forState:UIControlStateNormal];
            }
            [_maplatView setRotation:nextRotation];
            _nowRotation = nextRotation;
            break;
        case 7:
            [_maplatView currentMapInfo:^(NSDictionary *value){
                NSData *jsonData = [NSJSONSerialization dataWithJSONObject:value options:0 error:nil];
                NSString *text = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                [self toast:text];
            }];
            break;
    }
}

// トースト
- (void)toast:(NSString *)message
{
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:nil
                                                                   message:message
                                                            preferredStyle:UIAlertControllerStyleAlert];
    int duration = 1; // duration in seconds
    [self presentViewController: alert animated:YES completion:^(){
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, duration * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
            [alert dismissViewControllerAnimated:YES completion:nil];
        });
    }];
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
