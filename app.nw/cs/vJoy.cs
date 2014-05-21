#r "vJoyInterfaceWrap.dll"

using System.Threading.Tasks;
using vJoyInterfaceWrap;

	public class Startup
	{
		static public vJoy joystick;
        static public vJoy.JoystickState iReport;
        static public uint id = 0;
		static public VjdStat status;
		static public int started = 0;
		
		public async Task<object> Invoke(dynamic input)
		{
			return this.Joystick(input);
		}
		
		string Joystick(dynamic input) 
		{
			id = (uint) input.pid;
			joystick = new vJoy();
            iReport = new vJoy.JoystickState();
			
			if (!joystick.vJoyEnabled())
            {
                return "vJoy driver not enabled: Failed Getting vJoy attributes.\n";
            }
			if(started == 0){
				status = joystick.GetVJDStatus(id);
				switch (status)
				{
					case VjdStat.VJD_STAT_OWN:
					case VjdStat.VJD_STAT_FREE:
						break;
					case VjdStat.VJD_STAT_MISS:
					case VjdStat.VJD_STAT_BUSY:
					default:
						return "vJoy error\n" + status;
				};
				if(!joystick.AcquireVJD(id)){
					return "Cannot acquire!";
				}
				joystick.ResetVJD(id);
			}
			started = 1;
			bool btnStatus = false;
			uint btnId = 0;
			string teste = "";
			foreach(dynamic btn in input.buttons){
				foreach(dynamic btnP in btn.Value){
					if(btnP.Key == "bid"){
						btnId = (uint) btnP.Value;
					}
					if(btnP.Key == "status"){
						btnStatus = (bool) btnP.Value;
					}
				}
				joystick.SetBtn(btnStatus, id, btnId);
				teste += " " + btnId + ":(" + btnStatus + ")";
			}
			joystick.SetAxis(((int)input.axis.X), id, HID_USAGES.HID_USAGE_X);
			joystick.SetAxis(((int)input.axis.Y), id, HID_USAGES.HID_USAGE_Y);
			return "vJoy Enabled! " + id + teste;
		}
	}