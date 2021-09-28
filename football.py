from datetime import datetime
from dateutil.parser import parse
from pytz import timezone
import requests
from bs4 import BeautifulSoup

url_format = "https://www.oddschecker.com/football/{league}"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36",
    "cookie": "odds_default_stake=10; mobile_redirect=true; mobile_welcome_centre=false; basket="
    "; cookiePolicy=false; myoc_device=MDdjYjUzYmYtNjMyOS00YmZhLWExYmQtZTgwZjNiM2Y5YzIw; _gcl_au=1.1.1075723852.1631067469; _qubitTracker=fmbdawme5y8-0kpotmqqk-u3gebio; qb_generic=:XvDMnNX:oddschecker.com; localCacheBusterSSL=1.0.31; _gid=GA1.2.2092665978.1631067469; hideCountryBanner=true; ocGdpr_v1.0.0=true; odds_type=decimal; myoc=80c77cbaed58ef6470a4e411ac2fe7c6c4eb110c43a79014; logged_in=true; number_access=17; session_number_access=2021-09-08+03:49:01~17; session-id=52026A01F84D13F5A91D0D7D88DF7860; _ga_DYH22RGD1Z=GS1.1.1631067468.1.1.1631069342.0; _ga=GA1.2.198390153.1631067469; qb_session=16:1:49:Eu4R=Q:0:XvDMnUV:0:0:0:0:oddschecker.com; qb_permanent=fmbdawme5y8-0kpotmqqk-u3gebio:29:16:4:4:0::0:1:0:BgwB/X:BhOCSe:A::::99.30.243.162:dallas:77:united states:US:32.97:-96.8:dallas-ft. worth:623:texas:44:migrated|1631069344872:Eu4R==Z=CJ6X=K6&FGXz==B=CYJ+=J+::XvDTxRo:XvDMnUV:0:0:0::0:0:oddschecker.com:0",
}
league_mapper = {
    "英超": "english/premier-league",
    "西甲": "spain/la-liga-primera",
    "德甲": "germany/bundesliga",
    "意甲": "italy/serie-a",
    "葡超": "portugal/primeira-liga",
    "法甲": "france/ligue-1",
    "欧冠": "champions-league",
    "欧联": "europa-league",
    "欧会": "europa-conference-league",
    "中超": "world/china/super-league",
    "世欧预": "world-cup-european-qualifiers",
    "世南美预": "world-cup-south-american-qualifiers",
    "世北美预": "world-cup-concacaf-qualifiers",
    "解放者杯": "world/copa-libertadores",
    "亚冠": "world/afc-champions-league",
    "巴甲": "world/brazil/serie-a",
    "阿甲": "world/argentina/primera-division",
    "瑞超": "switzerland/super-league",
    "奥超": "austria/bundesliga",
    "荷甲": "netherlands/eredivisie",
    "瑞典甲": "sweden/allsvenskan",
    "土超": "turkey/super-lig",
    "苏超": "scottish/premiership",
    "俄超": "russia/premier-league",
    "墨超": "mexico/liga-mx",
    "j联赛": "world/japan/j-league",
    "mls": "world/usa/mls",
}


def get_football_info(league, include_odds=False):
    league = league_mapper.get(league)
    if league is None:
        supported_leagues = " ".join([k.upper() for k in league_mapper.keys()])
        return f"目前支持的联赛：{supported_leagues}\n机器人暂时抓不到国足数据哦。"
    url = url_format.format(league=league)
    html = requests.get(url, headers=headers).text
    soup = BeautifulSoup(html, "html.parser")
    rows: list[BeautifulSoup] = soup.select("table.at-hda tr")
    try:
        dates_visted = 0
        results = []
        for row in rows:
            date_soup = row.select_one(".event-date") or row.select_one(".bh-date")
            if date_soup:
                date = parse(date_soup.text).date()
                # formatted_date = date.strftime("%m月%d日")
                dates_visted += 1
                if dates_visted > 2:
                    break
                # results.append(formatted_date)
                continue
            if "match-on" in row.get("class"):
                fixture = row
                time_soup = fixture.select_one(".time-digits")
                if not time_soup:
                    if fixture.select_one(".in-play"):
                        formatted_time = "正在进行中"
                    else:
                        continue
                else:
                    time = parse(time_soup.text).time()
                    date_time = datetime.combine(date, time)
                    date_time = timezone("Europe/London").localize(date_time)
                    beijing_time = date_time.astimezone(timezone("Asia/Shanghai"))
                    formatted_time = beijing_time.strftime("%m-%d %H:%M")
                teams = [team.text for team in fixture.select(".fixtures-bet-name")]
                home_team = teams[0]
                away_team = teams[1]
                if not include_odds:
                    results.append(
                        f"""{formatted_time}
{home_team} vs {away_team}
        """
                    )
                else:
                    odds: list[BeautifulSoup] = fixture.select(".odds")
                    home_odd, draw_odd, away_odd = [odd.text for odd in odds]
                    results.append(
                        f"""{formatted_time}
{home_team} vs {away_team}
主: {home_odd}
平: {draw_odd}
客: {away_odd}
"""
                    )
        if not results:
            return "机器人没有找到这几天的比赛哦。"
        return "\n".join(results).strip()
    except AttributeError or requests.RequestException as e:
        print(e)
        return "机器人读取出了点问题哦。"


if __name__ == "__main__":
    print(get_football_info("世南美预", True))
