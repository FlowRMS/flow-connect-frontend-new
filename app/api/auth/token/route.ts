import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

export async function GET() {
  try {
    var { accessToken } = await withAuth();
    // accessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InNzb19vaWRjX2tleV9wYWlyXzAxSzVQSk5SUkJDWjNDMlo0UFZDQzZGOFdKIn0.eyJvcmdfbmFtZSI6IkZsb3ciLCJpc3MiOiJodHRwczovL2FwaS53b3Jrb3MuY29tL3VzZXJfbWFuYWdlbWVudC9jbGllbnRfMDFLNVBKTlMxNUpYVFY1MFpWQlpIQlg1R04iLCJzdWIiOiJ1c2VyXzAxS0VIUko4SlRNTTJOWjJNUUZYMzBDNVQzIiwic2lkIjoic2Vzc2lvbl8wMUtGTkcyNUVaRTlUWFNHOE5RM1dRV1hCRyIsImp0aSI6IjAxS0ZORzI1SjQ0WkVLUTJNNjM5Rk41UjI3Iiwib3JnX2lkIjoib3JnXzAxS0VFV01XVFg3MjlFN0JXQkg4NEFONTY0Iiwicm9sZSI6Im1lbWJlciIsInJvbGVzIjpbIm1lbWJlciJdLCJwZXJtaXNzaW9ucyI6W10sImV4cCI6MTc2OTI2MDY3NSwiaWF0IjoxNzY5MTc0Mjc1fQ.mCbLfZSSXZWI0SIudkv1ZdVaMvhHpseZ4dsJz5VdnIdrhOZ-RSv4Xros9_PSpUf3IGATmSgqKnnjbPSv0E93AxPifU-bjGOIQxhM5kMqhlhUsz5StBniOWpn3YIYzpQN8m-ntZk2OFSzsGm-inp4Y9Cgb1tDp79wnr0KIhxO40V9LR_mLxlMEHrGmztbXbbbg5LxoTws-xPPG9VNfDIRfG_1hV5h2uGL-tO38_IGJL4bsdwFg30MGnSAmfN6jAPrN2YoMfHBIlgqBZKu6zM0eQH5xdYRJPZG1d6uizOVh4rAL-DWnYtJXg-WHqjMkmYkuM6Vety3TkX0SIFfSCsteQ'

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}
