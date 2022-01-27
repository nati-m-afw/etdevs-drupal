<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* core/themes/classy/templates/dataset/forum-list.html.twig */
class __TwigTemplate_2167507263455afd1790ae00030b7bdc5bf96bf8ecbc31f3502ad43f9fa73a6d extends \Twig\Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
        $this->sandbox = $this->env->getExtension('\Twig\Extension\SandboxExtension');
        $this->checkSecurity();
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 33
        echo "<table id=\"forum-";
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["forum_id"] ?? null), 33, $this->source), "html", null, true);
        echo "\">
  <thead>
    <tr>
      <th>";
        // line 36
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->renderVar(t("Forum"));
        echo "</th>
      <th>";
        // line 37
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->renderVar(t("Topics"));
        echo "</th>
      <th>";
        // line 38
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->renderVar(t("Posts"));
        echo "</th>
      <th>";
        // line 39
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->renderVar(t("Last post"));
        echo "</th>
    </tr>
  </thead>
  <tbody>
  ";
        // line 43
        $context['_parent'] = $context;
        $context['_seq'] = twig_ensure_traversable(($context["forums"] ?? null));
        foreach ($context['_seq'] as $context["child_id"] => $context["forum"]) {
            // line 44
            echo "    <tr id=\"forum-list-";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($context["child_id"], 44, $this->source), "html", null, true);
            echo "\" class=\"";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "zebra", [], "any", false, false, true, 44), 44, $this->source), "html", null, true);
            echo "\">
      <td ";
            // line 45
            if ((twig_get_attribute($this->env, $this->source, $context["forum"], "is_container", [], "any", false, false, true, 45) == true)) {
                // line 46
                echo "colspan=\"4\" class=\"container\"";
            } else {
                // line 48
                echo "class=\"forum-list__forum\"";
            }
            // line 49
            echo ">
        ";
            // line 55
            echo "        ";
            if ((twig_get_attribute($this->env, $this->source, $context["forum"], "depth", [], "any", false, false, true, 55) > 0)) {
                $context['_parent'] = $context;
                $context['_seq'] = twig_ensure_traversable(range(1, twig_get_attribute($this->env, $this->source, $context["forum"], "depth", [], "any", false, false, true, 55)));
                foreach ($context['_seq'] as $context["_key"] => $context["i"]) {
                    echo "<div class=\"indented\">";
                }
                $_parent = $context['_parent'];
                unset($context['_seq'], $context['_iterated'], $context['_key'], $context['i'], $context['_parent'], $context['loop']);
                $context = array_intersect_key($context, $_parent) + $_parent;
            }
            // line 56
            echo "          <div class=\"forum__icon forum-status-";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "icon_class", [], "any", false, false, true, 56), 56, $this->source), "html", null, true);
            echo "\" title=\"";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "icon_title", [], "any", false, false, true, 56), 56, $this->source), "html", null, true);
            echo "\">
            <span class=\"visually-hidden\">";
            // line 57
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "icon_title", [], "any", false, false, true, 57), 57, $this->source), "html", null, true);
            echo "</span>
          </div>
          <div class=\"forum__name\"><a href=\"";
            // line 59
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "link", [], "any", false, false, true, 59), 59, $this->source), "html", null, true);
            echo "\">";
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "label", [], "any", false, false, true, 59), 59, $this->source), "html", null, true);
            echo "</a></div>
          ";
            // line 60
            if (twig_get_attribute($this->env, $this->source, twig_get_attribute($this->env, $this->source, $context["forum"], "description", [], "any", false, false, true, 60), "value", [], "any", false, false, true, 60)) {
                // line 61
                echo "            <div class=\"forum__description\">";
                echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, twig_get_attribute($this->env, $this->source, $context["forum"], "description", [], "any", false, false, true, 61), "value", [], "any", false, false, true, 61), 61, $this->source), "html", null, true);
                echo "</div>
          ";
            }
            // line 63
            echo "          ";
            if ((twig_get_attribute($this->env, $this->source, $context["forum"], "depth", [], "any", false, false, true, 63) > 0)) {
                $context['_parent'] = $context;
                $context['_seq'] = twig_ensure_traversable(range(1, twig_get_attribute($this->env, $this->source, $context["forum"], "depth", [], "any", false, false, true, 63)));
                foreach ($context['_seq'] as $context["_key"] => $context["i"]) {
                    echo "</div>";
                }
                $_parent = $context['_parent'];
                unset($context['_seq'], $context['_iterated'], $context['_key'], $context['i'], $context['_parent'], $context['loop']);
                $context = array_intersect_key($context, $_parent) + $_parent;
            }
            // line 64
            echo "      </td>
      ";
            // line 65
            if ((twig_get_attribute($this->env, $this->source, $context["forum"], "is_container", [], "any", false, false, true, 65) == false)) {
                // line 66
                echo "        <td class=\"forum__topics\">
          ";
                // line 67
                echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "num_topics", [], "any", false, false, true, 67), 67, $this->source), "html", null, true);
                echo "
          ";
                // line 68
                if ((twig_get_attribute($this->env, $this->source, $context["forum"], "new_topics", [], "any", false, false, true, 68) == true)) {
                    // line 69
                    echo "            <br />
            <a href=\"";
                    // line 70
                    echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "new_url", [], "any", false, false, true, 70), 70, $this->source), "html", null, true);
                    echo "\">";
                    echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "new_text", [], "any", false, false, true, 70), 70, $this->source), "html", null, true);
                    echo "</a>
          ";
                }
                // line 72
                echo "        </td>
        <td class=\"forum__posts\">";
                // line 73
                echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "num_posts", [], "any", false, false, true, 73), 73, $this->source), "html", null, true);
                echo "</td>
        <td class=\"forum__last-reply\">";
                // line 74
                echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, $context["forum"], "last_reply", [], "any", false, false, true, 74), 74, $this->source), "html", null, true);
                echo "</td>
      ";
            }
            // line 76
            echo "    </tr>
  ";
        }
        $_parent = $context['_parent'];
        unset($context['_seq'], $context['_iterated'], $context['child_id'], $context['forum'], $context['_parent'], $context['loop']);
        $context = array_intersect_key($context, $_parent) + $_parent;
        // line 78
        echo "  </tbody>
</table>
";
    }

    public function getTemplateName()
    {
        return "core/themes/classy/templates/dataset/forum-list.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  180 => 78,  173 => 76,  168 => 74,  164 => 73,  161 => 72,  154 => 70,  151 => 69,  149 => 68,  145 => 67,  142 => 66,  140 => 65,  137 => 64,  125 => 63,  119 => 61,  117 => 60,  111 => 59,  106 => 57,  99 => 56,  87 => 55,  84 => 49,  81 => 48,  78 => 46,  76 => 45,  69 => 44,  65 => 43,  58 => 39,  54 => 38,  50 => 37,  46 => 36,  39 => 33,);
    }

    public function getSourceContext()
    {
        return new Source("", "core/themes/classy/templates/dataset/forum-list.html.twig", "C:\\xampp\\htdocs\\etdevs-dp\\core\\themes\\classy\\templates\\dataset\\forum-list.html.twig");
    }
    
    public function checkSecurity()
    {
        static $tags = array("for" => 43, "if" => 45);
        static $filters = array("escape" => 33, "t" => 36);
        static $functions = array("range" => 55);

        try {
            $this->sandbox->checkSecurity(
                ['for', 'if'],
                ['escape', 't'],
                ['range']
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->source);

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }
}
