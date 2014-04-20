package com.fortytwoloops.intent;

import org.apache.cordova.CordovaActivity;
import android.content.Intent;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;

public class Intent extends CordovaPlugin {

    private CallbackContext callbackContext = null;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try {
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
        } catch (JSONException e) {
            e.printStackTrace();
            String errorMessage=e.getMessage();
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION,errorMessage));
            return false;
        }
    }

}
