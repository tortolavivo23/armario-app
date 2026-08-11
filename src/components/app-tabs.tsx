import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Accent, Colors, tagTint } from '@/constants/theme';
import { useColorScheme } from '@/context/theme-context';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      // The indicator is a pill drawn behind the selected icon, so it needs to
      // contrast with the bar; tintColor then keeps the icon legible on top of
      // it. Leaving the indicator the same colour as the bar made the selected
      // icon disappear.
      indicatorColor={tagTint(Accent, scheme === 'dark' ? 0.3 : 0.16)}
      tintColor={Accent}
      labelStyle={{ selected: { color: Accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Armario</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'tshirt', selected: 'tshirt.fill' }}
          md={{ default: 'checkroom', selected: 'checkroom' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="outfits">
        <NativeTabs.Trigger.Label>Outfits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.stack', selected: 'square.stack.fill' }}
          md={{ default: 'layers', selected: 'layers' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Label>Añadir</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          md={{ default: 'add_circle_outline', selected: 'add_circle' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
