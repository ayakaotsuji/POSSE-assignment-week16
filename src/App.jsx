import { useState, useEffect } from "react";

// ------------------------------------------------------
// 天気コード → 絵文字・説明 の対応表
// Open-Meteo はWMO(世界気象機関)の天気コードという数字で
// 天候を表すので、絵文字に変換する関数を用意しておく
// ------------------------------------------------------
function getWeatherEmoji(code) {
  if (code === 0) return "☀️"; // 快晴
  if (code === 1) return "🌤️"; // ほぼ晴れ
  if (code === 2) return "⛅"; // 一部曇り
  if (code === 3) return "☁️"; // 曇り
  if (code === 45 || code === 48) return "🌫️"; // 霧
  if ([51, 53, 55].includes(code)) return "🌦️"; // 霧雨
  if ([56, 57].includes(code)) return "🌧️"; // 着氷性の霧雨
  if ([61, 63, 65].includes(code)) return "🌧️"; // 雨
  if ([66, 67].includes(code)) return "🌧️"; // 着氷性の雨
  if ([71, 73, 75].includes(code)) return "❄️"; // 雪
  if (code === 77) return "🌨️"; // 霧雪
  if ([80, 81, 82].includes(code)) return "🌦️"; // にわか雨
  if ([85, 86].includes(code)) return "🌨️"; // にわか雪
  if (code === 95) return "⛈️"; // 雷雨
  if ([96, 99].includes(code)) return "⛈️"; // 雷雨(雹あり)
  return "❓"; // 未知のコード
}

function getWeatherLabel(code) {
  if (code === 0) return "快晴";
  if ([1, 2].includes(code)) return "晴れ";
  if (code === 3) return "曇り";
  if (code === 45 || code === 48) return "霧";
  if ([51, 53, 55, 56, 57].includes(code)) return "霧雨";
  if ([61, 63, 65, 66, 67].includes(code)) return "雨";
  if ([71, 73, 75, 77].includes(code)) return "雪";
  if ([80, 81, 82].includes(code)) return "にわか雨";
  if ([85, 86].includes(code)) return "にわか雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "不明";
}

// 曜日を「月」「火」...の形式に変換
function getDayLabel(dateString, index) {
  if (index === 0) return "今日";
  if (index === 1) return "明日";
  const date = new Date(dateString);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

// 「14時」のような時刻ラベルに変換
function getHourLabel(dateString) {
  const date = new Date(dateString);
  return `${date.getHours()}時`;
}

function App() {
  // ----------------------------------------------------
  // state設計
  // ----------------------------------------------------
  // weather      : APIから取ってきたデータ本体（current/hourly/dailyをまとめて持つ）
  // isLoading    : 取得中かどうか（読み込み中の表示を出し分けるため）
  // error        : 通信に失敗したときのエラーメッセージ
  // activeTab    : 選択中の時間軸。'current' | 'hourly' | 'weekly'
  //                 → ユーザーがタブをクリックすると変わる
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("current");

  // 表示する地点（今回は固定。緯度経度を変えれば別の街にできる）
  const LATITUDE = 35.5309; // 川崎市付近
  const LONGITUDE = 139.7030;
  const LOCATION_NAME = "川崎";

  // ----------------------------------------------------
  // データ取得：Week10で学んだ fetch → await → response.ok → try/catch の型
  // ----------------------------------------------------
  useEffect(() => {
    async function loadWeather() {
      setIsLoading(true);
      setError(null);

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
          `&current_weather=true` +
          `&hourly=temperature_2m,weathercode` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
          `&timezone=auto`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("通信エラー: " + response.status);
        }

        const data = await response.json();

        // まずConsoleで形を確認する癖（カリキュラム通り）
        console.log(data);

        setWeather(data);
      } catch (err) {
        console.error("天気の取得に失敗しました:", err);
        setError("天気データの取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setIsLoading(false);
      }
    }

    loadWeather();
  }, []); // 最初の表示のあとに1回だけ取得すればよいので空配列

  // ----------------------------------------------------
  // ローディング・エラー状態の表示
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-sky-50">
        <p className="text-gray-500">天気を読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-sky-50">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  // ----------------------------------------------------
  // タブに応じて表示する中身を切り替える
  // ----------------------------------------------------
  const tabs = [
    { key: "current", label: "現在" },
    { key: "hourly", label: "1時間ごと" },
    { key: "weekly", label: "週間" },
  ];

  return (
    <main className="min-h-screen bg-sky-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-1">{LOCATION_NAME}の天気</h1>
        <p className="text-gray-400 text-sm mb-4">
          最終更新: {new Date().toLocaleTimeString("ja-JP")}
        </p>

        {/* タブ切り替えボタン */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                activeTab === tab.key
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 現在の天気 */}
        {activeTab === "current" && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-6xl mb-2">
              {getWeatherEmoji(weather.current_weather.weathercode)}
            </div>
            <p className="text-lg text-gray-600 mb-1">
              {getWeatherLabel(weather.current_weather.weathercode)}
            </p>
            <p className="text-4xl font-bold">
              {Math.round(weather.current_weather.temperature)}°C
            </p>
            <p className="text-gray-400 text-sm mt-2">
              風速 {weather.current_weather.windspeed} km/h
            </p>
          </div>
        )}

        {/* 1時間ごとの天気（直近24時間） */}
        {activeTab === "hourly" && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex overflow-x-auto gap-4 pb-2">
              {weather.hourly.time.slice(0, 24).map((time, index) => (
                <div
                  key={time}
                  className="flex flex-col items-center flex-shrink-0 w-16"
                >
                  <p className="text-xs text-gray-400 mb-1">
                    {getHourLabel(time)}
                  </p>
                  <div className="text-2xl mb-1">
                    {getWeatherEmoji(weather.hourly.weathercode[index])}
                  </div>
                  <p className="text-sm font-medium">
                    {Math.round(weather.hourly.temperature_2m[index])}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 週間の天気 */}
        {activeTab === "weekly" && (
          <ul className="space-y-2">
            {weather.daily.time.map((date, index) => (
              <li
                key={date}
                className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between"
              >
                <span className="w-16 text-gray-600">
                  {getDayLabel(date, index)}
                </span>
                <span className="text-2xl">
                  {getWeatherEmoji(weather.daily.weathercode[index])}
                </span>
                <span className="text-sm text-gray-400">
                  {getWeatherLabel(weather.daily.weathercode[index])}
                </span>
                <span className="font-medium">
                  {Math.round(weather.daily.temperature_2m_max[index])}° /{" "}
                  <span className="text-gray-400">
                    {Math.round(weather.daily.temperature_2m_min[index])}°
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default App;