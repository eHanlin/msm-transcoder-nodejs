#格式說明

```
|byte|作用|類型|
|
|2|version|Num|
|2|sessionFieldsDataLength|Num|
|8|CreationTime|Num|
|8|LastAccessedTime|Num|
|4|MaxInactive|Num|
|1|isNew|Boolean|
|1|isValid|Boolean|
|8|ThisAccessedTime|Num|
|8|LastBackupTime|Num|
|2|idLength|Num|
|idLength|id|String|
|2|AuthType.valueOfValue(session.getAuthType()).getId()|Num|
|2|principalDataLength|Num|
|principalDataLength|principalData|String|
|2|savedRequestDataLength|Num|
|savedRequestDataLength|savedRequestData|ByteArray|
|2|savedPrincipalDataLength|Num|
|savedPrincipalDataLength|savedPrincipalData|ByteArray|
```

```java

public static int encodeNum( final long num, final byte[] data, final int beginIndex, final int maxBytes ) {
    for ( int i = 0; i < maxBytes; i++ ) {
        final int pos = maxBytes - i - 1; // the position of the byte in the number
        final int idx = beginIndex + pos; // the index in the data array
        data[idx] = (byte) ( ( num >> ( 8 * i ) ) & 0xff );
    }
    return beginIndex + maxBytes;
}

public static long decodeNum( final byte[] data, final int beginIndex, final int numBytes ) {
    long result = 0;
    for ( int i = 0; i < numBytes; i++ ) {
        final byte b = data[beginIndex + i];
        result = ( result << 8 ) | ( b < 0
            ? 256 + b
            : b );
    }
    return result;
}


private static int encodeBoolean( final boolean b, final byte[] data, final int index ) {
    data[index] = (byte) ( b
        ? '1'
        : '0' );
    return index + 1;
}

private static boolean decodeBoolean( final byte[] in, final int index ) {
    return in[index] == '1';
}


private static String decodeString( final byte[] data, final int beginIndex, final int length ) {
    try {
        final byte[] idData = new byte[length];
        System.arraycopy( data, beginIndex, idData, 0, length );
        return new String( idData, "UTF-8" );
    } catch ( final UnsupportedEncodingException e ) {
        throw new RuntimeException( e );
    }
}

```