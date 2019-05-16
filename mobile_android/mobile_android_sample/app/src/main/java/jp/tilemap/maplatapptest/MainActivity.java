package jp.tilemap.maplatapptest;

//import android.support.v7.app.AppCompatActivity;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.LocationSettingsStatusCodes;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import jp.tilemap.maplat.IMaplatMapCallbackHandler;
import jp.tilemap.maplat.MaplatView;
import jp.tilemap.maplat.IMaplatViewListener;

public class MainActivity extends Activity implements IMaplatViewListener {

    private static final int REQUEST_PERMISSION = 10;

    public static Button button1 = null;
    public static Button button2 = null;
    public static Button button3 = null;
    public static Button button4 = null;
    public static Button button5 = null;
    public static Button button6 = null;
    public static Button button7 = null;
    private MaplatView mMaplatView;
    private String nowMap;
    private double nowDirection;
    private double nowRotation;

    private FusedLocationProviderClient mFusedLocationClient;
    private SettingsClient mSettingsClient;
    private LocationRequest mLocationRequest;
    private LocationSettingsRequest mLocationSettingsRequest;
    private LocationCallback mLocationCallback;

    /**
     * Represents a geographical location.
     */
    private Location mCurrentLocation;

    private double defaultLongitude = 0;
    private double defaultLatitude = 0;
    static private double baseLongitude = 141.1529555;
    static private double baseLatitude = 39.7006006;
    private Gson mGson;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        final Context self = this;
        mGson = new GsonBuilder()
                .create();
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= 23){
            checkLocationPermission();
        }

        setContentView(R.layout.activity_main);

        //レイアウトで指定したWebViewのIDを指定する。
        mMaplatView = (MaplatView)findViewById(R.id.webView1);
        nowMap = "morioka_ndl";
        nowDirection = 0;
        nowRotation = 0;

        mMaplatView.initSetting(this, "mobile", new HashMap<String, Object>() {{
            put("app_name", "モバイルアプリ");
            put("sources", new ArrayList<Object>(){{
                add("gsi");
                add("osm");
                add(new HashMap<String, String>(){{
                    put("mapID", "morioka_ndl");
                }});
            }});
            put("pois", new ArrayList<Object>());
        }});

        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        mSettingsClient = LocationServices.getSettingsClient(this);
        createLocationCallback();
        createLocationRequest();
        buildLocationSettingsRequest();

        button1 = (Button)findViewById(R.id.button1);
        button1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String nextMap = nowMap.equals("morioka_ndl") ? "gsi" : "morioka_ndl";
                mMaplatView.changeMap(nextMap);
                nowMap = nextMap;
            }
        });

        button2 = (Button)findViewById(R.id.button2);
        button2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addMarkers();
            }
        });

        button3 = (Button)findViewById(R.id.button3);
        button3.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mMaplatView.clearLine();
                mMaplatView.clearMarker();
            }
        });

        button4 = (Button)findViewById(R.id.button4);
        button4.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mMaplatView.setViewpoint(39.69994722, 141.1501111);
            }
        });

        button5 = (Button)findViewById(R.id.button5);
        button5.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                double nextDirection;
                if (nowDirection == 0) {
                    nextDirection = -90;
                    button5.setText("南を上");
                } else if (nowDirection == -90) {
                    nextDirection = 180;
                    button5.setText("西を上");
                } else if (nowDirection == 180) {
                    nextDirection = 90;
                    button5.setText("北を上");
                } else {
                    nextDirection = 0;
                    button5.setText("東を上");
                }
                mMaplatView.setDirection(nextDirection);
                nowDirection = nextDirection;
            }
        });

        button6 = (Button)findViewById(R.id.button6);
        button6.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                double nextRotation;
                if (nowRotation == 0) {
                    nextRotation = -90;
                    button6.setText("下を上");
                } else if (nowRotation == -90) {
                    nextRotation = 180;
                    button6.setText("左を上");
                } else if (nowRotation == 180) {
                    nextRotation = 90;
                    button6.setText("上を上");
                } else {
                    nextRotation = 0;
                    button6.setText("右を上");
                }
                mMaplatView.setRotation(nextRotation);
                nowRotation = nextRotation;
            }
        });

        button7 = (Button)findViewById(R.id.button7);
        button7.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mMaplatView.currentMapInfo(new IMaplatMapCallbackHandler() {
                    @Override
                    public void callback(Map<String, ?> value) {
                        String text = mGson.toJson(value);
                        Toast.makeText(self, text, Toast.LENGTH_SHORT).show();
                    }
                });
            }
        });
    }

    // 位置情報許可の確認
    public void checkLocationPermission() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED){
            return; // 既に許可している
        }

        if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.ACCESS_FINE_LOCATION)) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, REQUEST_PERMISSION);
        } else {
            Toast toast = Toast.makeText(this,"許可しないとアプリが実行できません", Toast.LENGTH_SHORT);
            toast.show();
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION,}, REQUEST_PERMISSION);
        }
    }

    private static final long UPDATE_INTERVAL_IN_MILLISECONDS = 10000;
    private static final long FASTEST_UPDATE_INTERVAL_IN_MILLISECONDS = UPDATE_INTERVAL_IN_MILLISECONDS / 2;

    private void createLocationRequest() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setInterval(UPDATE_INTERVAL_IN_MILLISECONDS);
        mLocationRequest.setFastestInterval(FASTEST_UPDATE_INTERVAL_IN_MILLISECONDS);
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
    }

    private void createLocationCallback() {
        mLocationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                super.onLocationResult(locationResult);
                mCurrentLocation = locationResult.getLastLocation();
                double latitude;
                double longitude;
                if (defaultLatitude == 0 || defaultLongitude == 0) {
                    defaultLatitude = mCurrentLocation.getLatitude();
                    defaultLongitude = mCurrentLocation.getLongitude();
                    latitude = baseLatitude;
                    longitude = baseLongitude;
                } else {
                    latitude = baseLatitude - defaultLatitude + mCurrentLocation.getLatitude();
                    longitude = baseLongitude - defaultLongitude + mCurrentLocation.getLongitude();
                }
                mMaplatView.setGPSMarker(latitude, longitude, mCurrentLocation.getAccuracy());
            }
        };
    }

    private void buildLocationSettingsRequest() {
        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder();
        builder.addLocationRequest(mLocationRequest);
        mLocationSettingsRequest = builder.build();
    }

    public void startLocationUpdates() {
        final Context mContext = this;
        mSettingsClient.checkLocationSettings(mLocationSettingsRequest)
                .addOnSuccessListener(this, new OnSuccessListener<LocationSettingsResponse>() {
                    @Override
                    public void onSuccess(LocationSettingsResponse locationSettingsResponse) {
                        Log.i("MaplatBridge", "All location settings are satisfied.");

                        //noinspection MissingPermission
                        if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                            return;
                        }
                        mFusedLocationClient.requestLocationUpdates(mLocationRequest, mLocationCallback, Looper.myLooper());
                    }
                })
                .addOnFailureListener(this, new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        int statusCode = ((ApiException) e).getStatusCode();
                        switch (statusCode) {
                            case LocationSettingsStatusCodes.RESOLUTION_REQUIRED:
                                Log.i("MaplatBridge", "Location settings are not satisfied. Attempting to upgrade location settings.");
                                break;
                            case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
                                String errorMessage = "Location settings are inadequate, and cannot be fixed here. Fix in Settings.";
                                Log.e("MaplatBridge", errorMessage);
                                Toast.makeText(mContext, errorMessage, Toast.LENGTH_LONG).show();
                                break;
                        }
                    }
                });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == REQUEST_PERMISSION) {
            if (grantResults[0] != PackageManager.PERMISSION_GRANTED) {
                Toast toast = Toast.makeText(this,"アプリを実行できません", Toast.LENGTH_SHORT);
                toast.show();
            }
        }
    }

    @Override
    public void onReady() {
        addMarkers();
        startLocationUpdates();
    }

    @Override
    public void onClickMarker(String markerId, Object markerData) {
        String value = String.format(Locale.US, "clickMarker ID: %s DATA: %s", markerId, markerData);
        Toast.makeText(this, value, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onChangeViewpoint(double x, double y, double latitude, double longitude, double mercator_x,
                                  double mercator_y, double zoom, double merc_zoom, double direction, double rotation) {
        Log.d("changeViewpoint", String.format("XY: (%f, %f) LatLong: (%f, %f) Mecrator: (%f, %f) zoom: %f mercZoom: %f direction: %f rotation %f", x, y, latitude, longitude, mercator_x, mercator_y, zoom, merc_zoom, direction, rotation));
    }

    @Override
    public void onOutOfMap() {
        Toast.makeText(this, "地図範囲外です", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onClickMap(double latitude, double longitude) {
        String value = String.format(Locale.US, "clickMap latitude: %f longitude: %f", latitude, longitude);
        Toast.makeText(this, value, Toast.LENGTH_SHORT).show();
    }

    private void addMarkers() {
        try {
            mMaplatView.addLine(new ArrayList<ArrayList<Double>>(){{
                add(new ArrayList<Double>(){{
                    add(141.1501111); add(39.69994722);
                }});
                add(new ArrayList<Double>(){{
                    add(141.1529555); add(39.7006006);
                }});
            }}, null);
            mMaplatView.addLine(new ArrayList<ArrayList<Double>>(){{
                add(new ArrayList<Double>(){{
                    add(141.151995); add(39.701599);
                }});
                add(new ArrayList<Double>(){{
                    add(141.151137); add(39.703736);
                }});
                add(new ArrayList<Double>(){{
                    add(141.1521671); add(39.7090232);
                }});
            }}, new HashMap<String, Object>() {{
                put("color", "#ffcc33");
                put("width", 2);
            }});
        } catch (Exception e) {
            e.printStackTrace();
        }
        mMaplatView.addMarker(39.69994722, 141.1501111, 1, "001");
        mMaplatView.addMarker(39.7006006, 141.1529555, 5, "005");
        mMaplatView.addMarker(39.701599, 141.151995, 6, "006");
        mMaplatView.addMarker(39.703736, 141.151137, 7, "007");
        mMaplatView.addMarker(39.7090232, 141.1521671, 9, "009");
    }
}
