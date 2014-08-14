package com.fortytwoloops;

import org.apache.cordova.CordovaActivity;
import android.content.Intent;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;

public class StartIntent extends CordovaPlugin {

    private CallbackContext callbackContext = null;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        this.callbackContext = callbackContext;

        if (action.equals("getUri")) {
            if (args.length() != 0) {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.INVALID_ACTION));
                return false;
            }

            Intent i = ((CordovaActivity)this.cordova.getActivity()).getIntent();
            String uri = i.getDataString();
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, uri));
            return true;
        }
        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.INVALID_ACTION));
        return false;
    }

}
